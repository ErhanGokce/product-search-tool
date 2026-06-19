"use client";

import { useActionState } from "react";
import { Folder, Layers3, Trash2 } from "lucide-react";

import {
  createCategory,
  createSubCategory,
  deleteCategory,
  deleteSubCategory,
  updateCategory,
  updateSubCategory,
} from "@/app/dashboard/categories/actions";
import type {
  ActionState,
  ProductCategory,
  ProductSubCategory,
} from "@/components/product-pool/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CategoryManagerProps = {
  categories: ProductCategory[];
  subCategories: ProductSubCategory[];
};

const initialState: ActionState = { ok: false };

function InlineError({ state }: { state: ActionState }) {
  if (!state.error) {
    return null;
  }

  return <p className="text-xs text-red-600">{state.error}</p>;
}

function CategoryCreateForm() {
  const [state, action] = useActionState(createCategory, initialState);

  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row">
      <Input
        className="h-11 rounded-2xl"
        name="name"
        placeholder="Yeni kategori adi"
        required
      />
      <Button className="rounded-2xl" type="submit">
        Kategori ekle
      </Button>
      <InlineError state={state} />
    </form>
  );
}

function SubCategoryCreateForm({
  categories,
}: {
  categories: ProductCategory[];
}) {
  const [state, action] = useActionState(createSubCategory, initialState);

  return (
    <form action={action} className="grid gap-3 md:grid-cols-[220px_1fr_auto]">
      <Select name="category_id" required>
        <SelectTrigger className="h-11 rounded-2xl">
          <SelectValue placeholder="Kategori sec" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        className="h-11 rounded-2xl"
        name="name"
        placeholder="Yeni alt kategori adi"
        required
      />
      <Button className="rounded-2xl" disabled={categories.length === 0} type="submit">
        Alt kategori ekle
      </Button>
      <InlineError state={state} />
    </form>
  );
}

function CategoryRow({ category }: { category: ProductCategory }) {
  const [state, action] = useActionState(updateCategory, initialState);

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_auto]">
      <form action={action} className="flex gap-2">
        <input name="id" type="hidden" value={category.id} />
        <Input
          className="h-10 rounded-xl bg-white"
          defaultValue={category.name}
          name="name"
          required
        />
        <Button className="rounded-xl" type="submit" variant="outline">
          Kaydet
        </Button>
      </form>
      <form action={deleteCategory}>
        <input name="id" type="hidden" value={category.id} />
        <Button
          className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 sm:w-auto"
          type="submit"
          variant="outline"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Sil
        </Button>
      </form>
      <InlineError state={state} />
    </div>
  );
}

function SubCategoryRow({
  categories,
  subCategory,
}: {
  categories: ProductCategory[];
  subCategory: ProductSubCategory;
}) {
  const [state, action] = useActionState(updateSubCategory, initialState);

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[220px_1fr_auto]">
      <form action={action} className="contents">
        <input name="id" type="hidden" value={subCategory.id} />
        <Select defaultValue={subCategory.category_id} name="category_id">
          <SelectTrigger className="h-10 rounded-xl bg-white">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className="h-10 rounded-xl bg-white"
          defaultValue={subCategory.name}
          name="name"
          required
        />
        <Button className="rounded-xl" type="submit" variant="outline">
          Kaydet
        </Button>
      </form>
      <form action={deleteSubCategory} className="lg:col-start-3">
        <input name="id" type="hidden" value={subCategory.id} />
        <Button
          className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50"
          type="submit"
          variant="outline"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Sil
        </Button>
      </form>
      <InlineError state={state} />
    </div>
  );
}

export function CategoryManager({
  categories,
  subCategories,
}: CategoryManagerProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Folder className="h-5 w-5" aria-hidden="true" />
          </div>
          <CardTitle>Kategoriler</CardTitle>
          <CardDescription>
            Urun havuzunda kullanilacak ana kategorileri yonetin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CategoryCreateForm />
          <div className="space-y-3">
            {categories.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                Henuz kategori yok.
              </p>
            ) : (
              categories.map((category) => (
                <CategoryRow category={category} key={category.id} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Layers3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <CardTitle>Alt kategoriler</CardTitle>
          <CardDescription>
            Alt kategorileri ana kategorilere baglayin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SubCategoryCreateForm categories={categories} />
          <div className="space-y-3">
            {subCategories.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                Henuz alt kategori yok.
              </p>
            ) : (
              subCategories.map((subCategory) => (
                <SubCategoryRow
                  categories={categories}
                  key={subCategory.id}
                  subCategory={subCategory}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
