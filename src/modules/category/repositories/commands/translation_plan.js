const { toSlug } = require("../../../../helpers/utils/slug");

const LOCALES = ["en", "uz"];
const FIELDS = ["name", "description"];

function clean(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

function buildCategoryTranslationPlan({
  sourceName,
  sourceDescription = "",
  translations = {},
  currentCategory = null,
  currentStates = [],
}) {
  const normalizedName = String(sourceName ?? "").trim();
  const normalizedDescription = String(sourceDescription ?? "").trim();
  const statesByLocale = new Map(currentStates.map((state) => [state.locale, state]));
  const translationValues = {};
  const states = [];
  const targets = [];

  for (const locale of LOCALES) {
    const previousState = statesByLocale.get(locale) || {};
    const localeTargets = [];
    const fieldResults = {};

    for (const field of FIELDS) {
      const column = `${field}_${locale}`;
      const sourceText = field === "name" ? normalizedName : normalizedDescription;
      const previousValue = clean(currentCategory?.[column]);
      const supplied = Object.prototype.hasOwnProperty.call(translations?.[locale] || {}, field);
      const inputValue = supplied ? clean(translations[locale][field]) : previousValue;
      let origin = previousState[`${field}_origin`] || (previousValue ? "manual" : null);
      let value = inputValue;

      if (supplied && inputValue !== previousValue) {
        if (inputValue) {
          origin = "manual";
        } else {
          origin = sourceText ? "ai" : null;
        }
      } else if (
        origin === "ai" &&
        previousState[`${field}_source_text`] !== sourceText
      ) {
        value = null;
        if (!sourceText) origin = null;
      }

      // Legacy translations without provenance are treated as editor-owned.
      if (!origin && value) origin = "manual";

      const shouldTranslate = !value && Boolean(sourceText) && origin !== "manual";
      if (shouldTranslate) {
        origin = "ai";
        localeTargets.push({ locale, field });
      }

      const slug = field === "name" && value ? toSlug(value) || null : null;
      translationValues[column] = value;
      if (field === "name") translationValues[`slug_${locale}`] = slug;
      fieldResults[field] = {
        origin,
        sourceText: origin === "ai" ? sourceText : sourceText || null,
        value,
      };
    }

    targets.push(...localeTargets);
    const hasName = Boolean(fieldResults.name.value) || localeTargets.some((target) => target.field === "name");
    const needsDescription = Boolean(normalizedDescription);
    const hasDescription = !needsDescription || Boolean(fieldResults.description.value) || localeTargets.some((target) => target.field === "description");
    const status = localeTargets.length > 0
      ? "pending"
      : hasName && hasDescription
        ? "ready"
        : "none";

    states.push({
      locale,
      name_origin: fieldResults.name.origin,
      description_origin: fieldResults.description.origin,
      name_source_text: fieldResults.name.sourceText,
      description_source_text: fieldResults.description.sourceText,
      status,
      last_error: null,
    });
  }

  return { translationValues, states, targets };
}

function buildRetryTargets(category, state, locale) {
  const targets = [];
  if (state?.name_origin === "ai" && !category?.[`name_${locale}`] && category?.name) {
    targets.push({ locale, field: "name" });
  }
  if (
    state?.description_origin === "ai" &&
    !category?.[`description_${locale}`] &&
    category?.description
  ) {
    targets.push({ locale, field: "description" });
  }
  return targets;
}

function isCategorySourceCurrent(job, category) {
  return Boolean(category) &&
    category.name === job.sourceName &&
    String(category.description || "") === job.sourceDescription;
}

module.exports = { buildCategoryTranslationPlan, buildRetryTargets, isCategorySourceCurrent, LOCALES };
