"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { slugify } from "@/lib/utils";
import { productImageUrl } from "@/lib/product-image";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"] & {
  product_images?: ProductImage[];
};

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: Product;
}) {
  const router = useRouter();
  const isEdit = Boolean(product);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [images, setImages] = useState<ProductImage[]>(product?.product_images ?? []);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name")),
      slug: String(formData.get("slug")),
      categoryId: formData.get("categoryId") ? String(formData.get("categoryId")) : null,
      description: String(formData.get("description") ?? ""),
      priceKobo: Math.round(Number(formData.get("priceNaira")) * 100),
      stock: Number(formData.get("stock")),
      isActive: formData.get("isActive") === "on",
    };

    const url = isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(typeof data.error === "string" ? data.error : "Could not save product");
      setSubmitting(false);
      return;
    }

    toast.success(isEdit ? "Product updated" : "Product created");

    if (!isEdit) {
      router.push(`/admin/products/${data.product.id}/edit`);
    } else {
      router.refresh();
    }
    setSubmitting(false);
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !product) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/admin/products/${product.id}/images`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setUploading(false);
    event.target.value = "";

    if (!res.ok) {
      toast.error(typeof data.error === "string" ? data.error : "Could not upload image");
      return;
    }

    setImages((prev) => [...prev, data.image].sort((a, b) => a.position - b.position));
  }

  async function handleImageDelete(imageId: string) {
    if (!product) return;
    const res = await fetch(`/api/admin/products/${product.id}/images/${imageId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Could not remove image");
      return;
    }
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  }

  async function handleImageReorder(imageId: string, direction: "up" | "down") {
    if (!product) return;
    const res = await fetch(`/api/admin/products/${product.id}/images/${imageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    if (!res.ok) {
      toast.error("Could not reorder image");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          className="mt-1"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
      </div>

      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          required
          className="mt-1"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
        />
      </div>

      <div>
        <Label htmlFor="categoryId">Category</Label>
        <Select name="categoryId" defaultValue={product?.category_id ?? undefined}>
          <SelectTrigger id="categoryId" className="mt-1 w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          className="mt-1"
          defaultValue={product?.description ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priceNaira">Price (NGN)</Label>
          <Input
            id="priceNaira"
            name="priceNaira"
            type="number"
            step="0.01"
            min="0"
            required
            className="mt-1"
            defaultValue={product ? (product.price_kobo / 100).toString() : undefined}
          />
        </div>
        <div>
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            required
            className="mt-1"
            defaultValue={product?.stock ?? 0}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          defaultChecked={product?.is_active ?? true}
          className="size-4"
        />
        <Label htmlFor="isActive">Active (visible in storefront)</Label>
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : isEdit ? "Save changes" : "Create product"}
      </Button>

      {isEdit && (
        <div className="border-t pt-4">
          <Label>Images</Label>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {images.map((image, index) => (
              <div key={image.id} className="relative">
                <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                  <Image
                    src={productImageUrl(image.storage_path)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="150px"
                  />
                </div>
                <div className="mt-1 flex justify-between gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={index === 0}
                    onClick={() => handleImageReorder(image.id, "up")}
                  >
                    Up
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={index === images.length - 1}
                    onClick={() => handleImageReorder(image.id, "down")}
                  >
                    Down
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleImageDelete(image.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
          </div>
        </div>
      )}
    </form>
  );
}
