import { dAppName } from "config";
import { RouteType } from "libs/types";
import { withPageTitle } from "./components/PageTitle";
import { Home } from "./pages";

export const routeNames = {
  home: "/",
  unlock: "/unlock",
};

interface RouteWithTitleType extends RouteType {
  title: string;
}

export const routes: RouteWithTitleType[] = [
  {
    path: routeNames.home,
    title: "Home",
    component: Home,
  },
];

export const mappedRoutes = routes.map((route) => {
  const title = route.title ? `${route.title} • ${dAppName}` : `${dAppName}`;

  const requiresAuth = Boolean(route.authenticatedRoute);
  const wrappedComponent = withPageTitle(title, route.component);

  return {
    path: route.path,
    component: wrappedComponent,
    authenticatedRoute: requiresAuth,
  };
});
