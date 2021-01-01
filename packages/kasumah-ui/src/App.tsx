import React from "react";
import {
  ChakraProvider,
  CSSReset,
  localStorageManager,
  extendTheme
} from "@chakra-ui/react";
import { IndexPage } from "./pages/Index";

// 2. declare your configuration, these are the defaults
const config = {
  useSystemColorMode: true,
  initialColorMode: "light",
}
// 3. extend the theme
const customTheme = extendTheme({ config })

function App() {
  return (
      <ChakraProvider theme={customTheme} colorModeManager={localStorageManager}>
        <CSSReset />
        <IndexPage />
      </ChakraProvider>
  );
}

export default App;
