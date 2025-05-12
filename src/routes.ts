import { Home, StatusBoard, FAQ } from "./pages";

export const routeNames = {
  home: "/",
  login: "/login",
  paymentSuccess: "/payment-success",
  statusBoard: "/status-board",
  faq: "/faq",
  whitepaper: "/whitepaper",
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
    path: routeNames.statusBoard,
    title: "Status Board",
    component: StatusBoard,
  },
  {
    path: routeNames.faq,
    title: "FAQ",
    component: FAQ,
  },
];
