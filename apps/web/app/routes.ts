import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),
  route("overall", "routes/overall.tsx"),
  route("admin", "routes/admin.tsx"),
  route("cartao-digital", "routes/calcular.tsx"),
  route("login", "routes/login.tsx"),
  route("admin/login", "routes/admin-login.tsx"),
  route("register", "routes/register.tsx"),
] satisfies RouteConfig
