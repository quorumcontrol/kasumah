import { Box, Center } from '@chakra-ui/react'
import React from 'react'
import { Navbar } from '../components/Navbar/Navbar'

export const DefaultLayout:React.FC = ({children}) => {
    return (
        <Box>
            <Navbar/>
            <Center>
                {children}
            </Center>
        </Box>
       
    )
}