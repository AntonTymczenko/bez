import { type Locale, Dictionary } from '../app/i18n'

export type DictionaryKey = 'heading' | 'message' | 'flag' | 'dish' | 'recipe'

export const CONTENT: Record<Locale, Dictionary> = {
    pl: {
        heading: 'Bez Cukru, bez Glutenu',
        message:
            'Strona jest w budowie. Prosimy o cierpliwość, blog pojawi się wkrótce!',
        flag: '🇵🇱',
        dish: 'Potrawa',
        recipe: 'Trzy łyżky mąki kokosowej',
    },
    uk: {
        heading: 'Без Цукру, без Глютену',
        message:
            'Сайт знаходиться в розробці. Будь ласка, очікуйте на блог найближчим часом!',
        flag: '🇺🇦',
        dish: 'Страва',
        recipe: 'Три столові ложки кокосового борошна',
    },
    en: {
        heading: 'No Sugar, no Gluten',
        message: 'Site is under construction. The blog will be ready soon!',
        flag: '🇺🇲',
        dish: 'Dish',
        recipe: 'Three table spoons of coconut flour',
    },
}
