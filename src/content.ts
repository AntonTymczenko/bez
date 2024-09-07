type LANG_CODES = "pl" | "ua";
type PARTS = "heading" | "message";

type CONTENT_LOCALIZED = Record<PARTS, string>;

const CONTENT: Record<LANG_CODES, CONTENT_LOCALIZED> = {
  pl: {
    heading: "Bez Cukru, bez Glutenu",
    message:
      "Strona jest w budowie. Prosimy o cierpliwość, blog pojawi się wkrótce!",
  },
  ua: {
    heading: "Без Цукру, без Глютену",
    message:
      "Сайт знаходиться в розробці. Будь ласка, очікуйте на блог найближчим часом!",
  },
};

export const defaultCode = "pl";

export const getContent = (languageCode?: string): CONTENT_LOCALIZED => {
  const data = CONTENT[languageCode ?? defaultCode] ?? CONTENT[defaultCode];

  return data;
};
