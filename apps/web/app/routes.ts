import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),
  route("calcular", "routes/calcular.tsx"),
] satisfies RouteConfig
