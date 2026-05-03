import { LoginForm } from "@/components/auth/login-form";
import { getSupabaseConfig } from "@/lib/supabase/config";

export default function LoginPage() {
  const { isConfigured } = getSupabaseConfig();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_36%),linear-gradient(180deg,#f8fafc_0%,#eff6ff_100%)] px-4 py-8 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] lg:grid-cols-2">
          <div className="flex flex-col justify-between bg-slate-950 p-8 text-white sm:p-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                ConstructFlow
              </p>
              <h1 className="mt-4 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
                Каркас строительного SaaS, готовый для реальной работы.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
                Отслеживайте проекты, управляйте этапами, анализируйте вопросы безопасности
                и ведите акты, отчеты и планирование в одном профессиональном рабочем пространстве.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-semibold text-white">24</div>
                <div className="mt-1 text-slate-300">Активных этапа</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-semibold text-white">98%</div>
                <div className="mt-1 text-slate-300">Заполнение дневных отчетов</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-8 sm:p-10">
            <div className="w-full max-w-md">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Вход
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  С возвращением
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  Используйте учетную запись рабочего пространства, чтобы продолжить работу в строительной панели.
                </p>
              </div>

              {!isConfigured ? (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Supabase еще не настроен. Укажите
                  <span className="font-medium"> NEXT_PUBLIC_SUPABASE_URL </span>
                  и <span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                  , чтобы включить реальный вход.
                </div>
              ) : null}

              <LoginForm />

              <p className="mt-6 text-xs leading-5 text-slate-500">
                Реальный вход по email и паролю работает через Supabase Auth и защищен
                серверными cookie сессии.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
