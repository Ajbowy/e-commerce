-- Optional sample data for local development. Run after schema.sql.

insert into categories (name, slug) values
  ('Apparel', 'apparel'),
  ('Accessories', 'accessories'),
  ('Home & Living', 'home-living')
on conflict (slug) do nothing;

insert into products (category_id, name, slug, description, price_kobo, stock, is_active)
select c.id, p.name, p.slug, p.description, p.price_kobo, p.stock, true
from (values
  ('apparel', 'Classic Crew T-Shirt', 'classic-crew-tshirt', 'Soft cotton crew-neck t-shirt.', 850000, 40),
  ('apparel', 'Everyday Hoodie', 'everyday-hoodie', 'Midweight fleece hoodie for daily wear.', 2200000, 25),
  ('accessories', 'Leather Wallet', 'leather-wallet', 'Slim bifold wallet in full-grain leather.', 1500000, 30),
  ('accessories', 'Canvas Tote Bag', 'canvas-tote-bag', 'Durable canvas tote for everyday errands.', 950000, 50),
  ('home-living', 'Ceramic Mug Set', 'ceramic-mug-set', 'Set of two handmade ceramic mugs.', 1200000, 20),
  ('home-living', 'Scented Candle', 'scented-candle', 'Soy wax candle, 40-hour burn time.', 700000, 60)
) as p(category_slug, name, slug, description, price_kobo, stock)
join categories c on c.slug = p.category_slug
on conflict (slug) do nothing;
