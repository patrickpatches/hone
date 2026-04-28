export interface PantryItem {
  id: string; name: string; category: string;
  quantity: number | null; unit: string | null; have_it: boolean;
}
export async function upsertPantryItem(_db: any, _i: PantryItem): Promise<void> {}
