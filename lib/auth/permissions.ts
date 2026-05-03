import type { Role } from "@/lib/auth/types";

export type NavigationItem = {
  label: string;
  href: string;
  description: string;
  allowedRoles: Role[];
};

export const navigationItems: NavigationItem[] = [
  {
    label: "Панель",
    href: "/dashboard",
    description: "Обзор портфеля и приоритеты",
    allowedRoles: ["admin", "foreman", "engineer", "worker"],
  },
  {
    label: "Проекты",
    href: "/projects",
    description: "Список проектов, объектов и этапов",
    allowedRoles: ["admin", "foreman", "engineer", "worker"],
  },
  {
    label: "Отчеты",
    href: "/projects/alpha-tower/reports",
    description: "Дневной контроль и AI-отчеты",
    allowedRoles: ["admin", "foreman", "engineer", "worker"],
  },
  {
    label: "Безопасность",
    href: "/projects/alpha-tower/safety",
    description: "Инциденты, нарушения и рекомендации",
    allowedRoles: ["admin", "foreman", "engineer", "worker"],
  },
  {
    label: "AR-планирование",
    href: "/projects/alpha-tower/ar",
    description: "Метки на стенах и планирование раскладки",
    allowedRoles: ["admin", "foreman", "engineer"],
  },
  {
    label: "Акты",
    href: "/projects/alpha-tower/acts",
    description: "Закрытие этапов и электронные акты",
    allowedRoles: ["admin", "engineer"],
  },
  {
    label: "Настройки",
    href: "/settings",
    description: "Пользователи, роли и настройки рабочего пространства",
    allowedRoles: ["admin"],
  },
];

export function getNavigationItemsForRole(role: Role) {
  return navigationItems.filter((item) => item.allowedRoles.includes(role));
}

export function canAccessNavigationItem(role: Role, href: string) {
  return navigationItems.some((item) => item.href === href && item.allowedRoles.includes(role));
}
