import { Home } from "./pages";

export const routeNames = {
  home: "/",
  login: "/login",
};

interface RouteType {
  path: string;
  component: any;
  authenticatedRoute?: boolean;
}

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
