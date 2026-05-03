import { PageHeader } from "@/components/layout/page-header";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Рабочее пространство"
        title="Настройки"
        description="Управляйте пользователями, ролями, предпочтениями рабочего пространства и настройками SaaS."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader>
            <PanelTitle>Контроль доступа</PanelTitle>
          </PanelHeader>
          <PanelBody>
            <div className="space-y-4">
              {[
                ["Администратор", "Полный доступ к проектам и управлению пользователями"],
                ["Прораб", "Контроль прогресса и уведомления по безопасности"],
                ["Инженер", "Проверка этапов и подписание актов"],
                ["Рабочий", "Фотографии, задания и микрокурсы"],
              ].map(([role, description]) => (
                <div key={role} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-medium text-slate-950">{role}</p>
                  <p className="mt-1 text-sm text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle>Параметры рабочего пространства</PanelTitle>
          </PanelHeader>
          <PanelBody>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-slate-600">Название рабочего пространства</span>
                <span className="font-medium text-slate-950">ConstructFlow Demo</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-slate-600">Регион</span>
                <span className="font-medium text-slate-950">Europe / Moscow</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-slate-600">Аутентификация</span>
                <span className="font-medium text-slate-950">Supabase подключен</span>
              </div>
            </div>
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}
