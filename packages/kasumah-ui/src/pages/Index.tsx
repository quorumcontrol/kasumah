import { Box, Button, Heading, Input, Stack } from "@chakra-ui/react";
import React from "react";
import { DefaultLayout } from "../layouts/Default";

export const IndexPage: React.FC = () => {
  return (
    <DefaultLayout>
      <Box>
        <form>
          <Heading>Login or Signup</Heading>
          <Stack spacing={3}>
            <Input placeholder="email" type="email" />
            <Input placeholder="password" type="password" />
            <Button>Login or Signup</Button>
          </Stack>
        </form>
      </Box>
    </DefaultLayout>
  );
};
