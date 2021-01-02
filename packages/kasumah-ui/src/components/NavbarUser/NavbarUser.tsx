import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import React from "react";
import { Identicon } from "../Identicon/Identicon";

export const NavbarUser: React.FC = () => {
  return (
    <Box rounded={2} border={1}>
      <HStack>
        <Identicon account="abcdefghijklmnopqrs" />
        <Text>Unknown user</Text>
      </HStack>
    </Box>
  );
};
