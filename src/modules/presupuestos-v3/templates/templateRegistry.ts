import {
  templateInicial,
} from "./templateInicial";

import type {
  PresupuestoTemplate,
  PresupuestoTemplateCategory,
} from "../types/editor.types";

const systemTemplates: PresupuestoTemplate[] = [
  templateInicial,
];

export const templateRegistry = {
  getAll(): PresupuestoTemplate[] {
    return [
      ...systemTemplates,
    ];
  },

  getSystemTemplates(): PresupuestoTemplate[] {
    return [
      ...systemTemplates,
    ];
  },

  getById(
    templateId: string,
  ): PresupuestoTemplate | null {
    return (
      systemTemplates.find(
        (template) =>
          template.id ===
          templateId,
      ) ?? null
    );
  },

  getByCategory(
    category: PresupuestoTemplateCategory,
  ): PresupuestoTemplate[] {
    return systemTemplates.filter(
      (template) =>
        template.category ===
        category,
    );
  },

  getDefault(): PresupuestoTemplate {
    const defaultTemplate =
      systemTemplates[0];

    if (!defaultTemplate) {
      throw new Error(
        "No hay templates registrados en Presupuestos V3.",
      );
    }

    return defaultTemplate;
  },

  isSystemTemplate(
    templateId: string,
  ): boolean {
    return systemTemplates.some(
      (template) =>
        template.id ===
        templateId,
    );
  },
};
