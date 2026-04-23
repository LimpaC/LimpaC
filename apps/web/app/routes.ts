import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),
  route("cartao-digital", "routes/calcular.tsx"),
] satisfies RouteConfig
