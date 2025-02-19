import { Home, Remix } from "./pages";

export const routeNames = {
  home: "/",
  login: "/login",
  remix: "/remix",
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
  {
    path: routeNames.remix,
    title: "Remix",
    component: Remix,
  },
];
