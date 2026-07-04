import { getDb, randomId } from "./db";
import { getSettingNumber } from "./settings";

export type TravelArea = {
  id: string;
  name: string;
  postcodePrefix: string | null;
  charge: number;
  sort: number;
  createdAt: string;
  updatedAt: string;
};

type DbTravelArea = {
  id: string;
  name: string;
  postcode_prefix: string | null;
  charge: number;
  sort: number;
  created_at: string;
  updated_at: string;
};

function toArea(row: DbTravelArea): TravelArea {
  return {
    id: row.id,
    name: row.name,
    postcodePrefix: row.postcode_prefix,
    charge: row.charge,
    sort: row.sort,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function defaultTravelCharge(): number {
  return getSettingNumber("default_travel_charge", 15);
}

export function getAllTravelAreas(): TravelArea[] {
  const rows = getDb()
    .prepare("SELECT * FROM travel_areas ORDER BY charge ASC, sort ASC, name ASC")
    .all() as DbTravelArea[];
  return rows.map(toArea);
}

export function getTravelAreaById(id: string): TravelArea | null {
  const row = getDb()
    .prepare("SELECT * FROM travel_areas WHERE id = ?")
    .get(id) as DbTravelArea | undefined;
  return row ? toArea(row) : null;
}

export function createTravelArea(data: {
  name: string;
  postcodePrefix?: string;
  charge: number;
}): TravelArea {
  const db = getDb();
  const now = new Date().toISOString();
  const id = randomId();
  const maxSort = (
    db.prepare("SELECT COALESCE(MAX(sort), -1) AS m FROM travel_areas").get() as {
      m: number;
    }
  ).m;
  db.prepare(
    `INSERT INTO travel_areas (id, name, postcode_prefix, charge, sort, created_at, updated_at)
     VALUES (@id, @name, @prefix, @charge, @sort, @now, @now)`
  ).run({
    id,
    name: data.name.trim(),
    prefix: data.postcodePrefix?.trim().toUpperCase() || null,
    charge: data.charge,
    sort: maxSort + 1,
    now,
  });
  return getTravelAreaById(id)!;
}

export function updateTravelArea(
  id: string,
  data: Partial<{ name: string; postcodePrefix: string | null; charge: number }>
): TravelArea | null {
  const db = getDb();
  const fields: string[] = ["updated_at = @now"];
  const params: Record<string, unknown> = { id, now: new Date().toISOString() };
  if (data.name !== undefined) { fields.push("name = @name"); params.name = data.name.trim(); }
  if ("postcodePrefix" in data) {
    fields.push("postcode_prefix = @prefix");
    params.prefix = data.postcodePrefix ? data.postcodePrefix.trim().toUpperCase() : null;
  }
  if (data.charge !== undefined) { fields.push("charge = @charge"); params.charge = data.charge; }
  db.prepare(`UPDATE travel_areas SET ${fields.join(", ")} WHERE id = @id`).run(params);
  return getTravelAreaById(id);
}

export function deleteTravelArea(id: string): boolean {
  return getDb().prepare("DELETE FROM travel_areas WHERE id = ?").run(id).changes > 0;
}

// Resolve a travel charge from a free-text location or postcode. Matches a
// named area or postcode prefix; anything unrecognised gets the default charge.
export function resolveTravelCharge(input: string): {
  charge: number;
  matchedArea: string | null;
  included: boolean;
} {
  const raw = (input ?? "").trim();
  if (!raw) {
    return { charge: 0, matchedArea: null, included: false };
  }
  const upper = raw.toUpperCase();
  const compact = upper.replace(/\s+/g, "");
  const areas = getAllTravelAreas();

  for (const area of areas) {
    const nameMatch = upper.includes(area.name.toUpperCase());
    const prefixMatch =
      !!area.postcodePrefix &&
      compact.startsWith(area.postcodePrefix.replace(/\s+/g, ""));
    if (nameMatch || prefixMatch) {
      return {
        charge: area.charge,
        matchedArea: area.name,
        included: area.charge === 0,
      };
    }
  }

  return { charge: defaultTravelCharge(), matchedArea: null, included: false };
}
