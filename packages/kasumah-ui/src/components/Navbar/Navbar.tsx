import { Box, Spacer, Text } from "@chakra-ui/react";
import React from "react";
import { NavbarContainer } from "../NavbarContainer/NavbarContainer";
import { NavbarUser } from "../NavbarUser/NavbarUser";

export const Navbar: React.FC = () => {
  return (
    <NavbarContainer>
      <Box>
        <Text fontSize="lg" fontWeight="bold">
            Kasumah
        </Text>
      </Box>
      <Spacer />
      <NavbarUser/>

    </NavbarContainer>
  );
};
