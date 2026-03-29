import type { Database } from "bun:sqlite";
import { randomUUID } from "crypto";

export interface Theme {
  id: string;
  name: string;
  backgroundType: string;
  backgroundValue: string;
  backgroundFit: string;
  fontFamily: string;
  fontSize: string;
  fontColor: string;
  fontWeight: string;
  textShadow: string;
  textAlign: string;
  transition: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateThemeInput {
  name: string;
  backgroundType?: string;
  backgroundValue?: string;
  backgroundFit?: string;
  fontFamily?: string;
  fontSize?: string;
  fontColor?: string;
  fontWeight?: string;
  textShadow?: string;
  textAlign?: string;
  transition?: string;
}

export class ThemesService {
  constructor(private db: Database) {}

  create(input: CreateThemeInput): Theme {
    const id = randomUUID();
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO themes (id, name, background_type, background_value, background_fit, font_family, font_size, font_color, font_weight, text_shadow, text_align, transition, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, input.name,
      input.backgroundType ?? "color", input.backgroundValue ?? "#000000", input.backgroundFit ?? "cover",
      input.fontFamily ?? "system-ui", input.fontSize ?? "clamp(2rem, 5vw, 5rem)",
      input.fontColor ?? "#ffffff", input.fontWeight ?? "400",
      input.textShadow ?? "2px 2px 8px rgba(0,0,0,0.8)", input.textAlign ?? "center",
      input.transition ?? "fade", now,
    );
    return this.getById(id)!;
  }

  list(): Theme[] {
    return (this.db.prepare("SELECT * FROM themes ORDER BY is_default DESC, name ASC").all() as any[]).map(this.hydrate);
  }

  getById(id: string): Theme | null {
    const row = this.db.prepare("SELECT * FROM themes WHERE id = ?").get(id) as any;
    return row ? this.hydrate(row) : null;
  }

  getDefault(): Theme | null {
    const row = this.db.prepare("SELECT * FROM themes WHERE is_default = 1").get() as any;
    return row ? this.hydrate(row) : null;
  }

  update(id: string, input: Partial<CreateThemeInput>): Theme {
    const fields: string[] = [];
    const values: any[] = [];
    const map: Record<string, string> = {
      name: "name", backgroundType: "background_type", backgroundValue: "background_value",
      backgroundFit: "background_fit", fontFamily: "font_family", fontSize: "font_size",
      fontColor: "font_color", fontWeight: "font_weight", textShadow: "text_shadow",
      textAlign: "text_align", transition: "transition",
    };
    for (const [key, col] of Object.entries(map)) {
      if ((input as any)[key] !== undefined) {
        fields.push(`${col} = ?`);
        values.push((input as any)[key]);
      }
    }
    if (fields.length > 0) {
      values.push(id);
      this.db.prepare(`UPDATE themes SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    }
    return this.getById(id)!;
  }

  setDefault(id: string): void {
    this.db.prepare("UPDATE themes SET is_default = 0").run();
    this.db.prepare("UPDATE themes SET is_default = 1 WHERE id = ?").run(id);
  }

  delete(id: string): void {
    this.db.prepare("DELETE FROM themes WHERE id = ?").run(id);
  }

  private hydrate(row: any): Theme {
    return {
      id: row.id,
      name: row.name,
      backgroundType: row.background_type,
      backgroundValue: row.background_value,
      backgroundFit: row.background_fit,
      fontFamily: row.font_family,
      fontSize: row.font_size,
      fontColor: row.font_color,
      fontWeight: row.font_weight,
      textShadow: row.text_shadow,
      textAlign: row.text_align,
      transition: row.transition,
      isDefault: !!row.is_default,
      createdAt: row.created_at,
    };
  }
}
