import { type Locale, PageContent } from '../app/i18n'

export const CONTENT: Record<string, Record<Locale, PageContent>> = {
    '/': {
        pl: {
            heading: 'Bez Cukru, bez Glutenu',
            body: 'Strona jest w budowie. Prosimy o cierpliwość, blog pojawi się wkrótce!',
        },
        uk: {
            heading: 'Без Цукру, без Глютену',
            body: 'Сайт знаходиться в розробці. Будь ласка, очікуйте на блог найближчим часом!',
        },
        en: {
            heading: 'No Sugar, no Gluten',
            body: 'Site is under construction. The blog will be ready soon!',
        },
    },
    '/recipe': {
        pl: {
            heading: 'Potrawa',
            body: 'Trzy łyżky mąki kokosowej',
        },
        uk: {
            heading: 'Страва',
            body: 'Три столові ложки кокосового борошна',
        },
        en: {
            heading: 'Dish',
            body: 'Three table spoons of coconut flour',
        },
    },
}
