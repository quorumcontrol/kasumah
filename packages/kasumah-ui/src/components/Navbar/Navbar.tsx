import { Box, Text } from "@chakra-ui/react";
import React from "react";
import { NavbarContainer } from "../NavbarContainer/NavbarContainer";

export const Navbar: React.FC = () => {
  return (
    <NavbarContainer>
      <Box>
        <Text fontSize="lg" fontWeight="bold">
            Kasumah
        </Text>
      </Box>
    </NavbarContainer>
  );
};
