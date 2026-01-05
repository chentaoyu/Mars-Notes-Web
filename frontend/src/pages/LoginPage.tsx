import { LoginForm } from "../components/auth/LoginForm";
import { Toaster } from "../components/ui/toaster";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/20 via-purple-400/10 to-pink-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-400/20 via-blue-400/10 to-cyan-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </div>

      {/* 左侧装饰区域 */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-16 relative z-10">
        <div className="max-w-lg space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium w-fit">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              安全 · 可靠 · 高效
            </div>
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 bg-clip-text text-transparent">
              欢迎回来
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
              开始记录你的想法，让每一刻都值得珍藏
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 pt-8 border-t border-slate-200/50 dark:border-slate-800">
            <div className="flex items-start gap-4 group">
              <div className="mt-1 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                ✨
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">优雅设计</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">简洁美观的界面，带来愉悦的使用体验</div>
              </div>
            </div>
            <div className="flex items-start gap-4 group">
              <div className="mt-1 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                🔒
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">安全可靠</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">数据加密存储，保护你的隐私安全</div>
              </div>
            </div>
            <div className="flex items-start gap-4 group">
              <div className="mt-1 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">快速同步</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">随时随地访问，多设备无缝同步</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧登录表单区域 */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-800 p-8 space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">登录账户</h2>
              <p className="text-slate-600 dark:text-slate-400">请输入您的账户信息以继续</p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
