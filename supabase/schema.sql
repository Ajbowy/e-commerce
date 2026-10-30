-- Run this once in the Supabase SQL editor (or via `supabase db push`) for a fresh project.

-- ============================================================================
-- Tables
-- ============================================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  -- stored in kobo (minor unit) to match Paystack's integer-amount API and avoid float rounding
  price_kobo integer not null check (price_kobo >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'fulfilled', 'cancelled')),
  total_kobo integer not null check (total_kobo >= 0),
  paystack_reference text unique,
  -- client-generated key for one checkout attempt, so a retried/duplicated
  -- request (flaky connection, double-click) reuses this order instead of
  -- creating a second one and double-reserving stock.
  idempotency_key text unique,
  customer_email text not null,
  shipping_address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  -- snapshotted at purchase time so historical orders survive product edits/deletes
  product_name text not null,
  unit_price_kobo integer not null,
  quantity integer not null check (quantity > 0)
);

create index products_category_id_idx on products(category_id);
create index product_images_product_id_idx on product_images(product_id);
create index orders_user_id_idx on orders(user_id);
create index order_items_order_id_idx on order_items(order_id);

-- ============================================================================
-- profiles row is created automatically for every new auth user
-- ============================================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- keep updated_at current on products/orders
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on products
  for each row execute procedure public.set_updated_at();

create trigger orders_set_updated_at
  before update on orders
  for each row execute procedure public.set_updated_at();

-- Atomic stock decrement, called from the Paystack webhook handler after a
-- payment is confirmed. Written as SQL (not a client-side read-then-write)
-- to avoid a race condition between concurrent orders for the same product.
create function public.decrement_product_stock(p_product_id uuid, p_quantity integer)
returns void
language sql
security definer set search_path = public
as $$
  update products
  set stock = greatest(stock - p_quantity, 0)
  where id = p_product_id;
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- profiles: a user can read/update their own row only. All other reads/writes
-- (e.g. admin checks) go through server code using the service-role key.
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- categories/products/product_images: public read of the active catalog.
-- All writes happen via Route Handlers using the service-role key, so no
-- insert/update/delete policies are defined here (default-deny).
create policy "categories_select_public" on categories
  for select using (true);

create policy "products_select_active" on products
  for select using (is_active = true);

create policy "product_images_select_public" on product_images
  for select using (
    exists (
      select 1 from products
      where products.id = product_images.product_id
      and products.is_active = true
    )
  );

-- orders/order_items: a user can read only their own orders. Order creation
-- and admin updates happen via Route Handlers using the service-role key.
create policy "orders_select_own" on orders
  for select using (auth.uid() = user_id);

create policy "order_items_select_own" on order_items
  for select using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Storage: public-read bucket for product images. Writes happen via
-- Route Handlers using the service-role key.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_bucket_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

-- ============================================================================
-- After running this file: promote your first admin manually, e.g.
--   update profiles set role = 'admin' where id = '<your-user-uuid>';
-- ============================================================================
