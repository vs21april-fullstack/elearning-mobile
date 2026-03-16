import Router from "./router";

import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <>
      <Router />
      <Toaster position="top-center" />
    </>
  );
}
