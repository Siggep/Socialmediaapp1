import { StatusBar } from 'expo-status-bar';
import React, {useEffect} from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Amplify, { 
  Auth, 
  API, 
  graphqlOperation 
} from 'aws-amplify';
import { withAuthenticator } from 'aws-amplify-react-native'

import useCachedResources from './hooks/useCachedResources';
import useColorScheme from './hooks/useColorScheme';
import Navigation from './navigation';
import config from './aws-exports';
import { getUser } from './src/graphql/queries';
import { createUser } from './src/graphql/mutations';

Amplify.configure(config)

function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();

  const getRandomImage = () => {
    return 'https://i.insider.com/5d03aa8e6fc9201bc7002b43?width=1136&format=jpeg'
  }

  const saveUserToDB = async (user) => {
    console.log(user);
    await API.graphql(graphqlOperation(createUser, {input: user }))
  }

  useEffect(() => {
    const updateUser = async () => {
      const userInfo = await Auth.currentAuthenticatedUser({bypassCache: true});
      
      if(userInfo) {
        const userData = await API.graphql(graphqlOperation(getUser, { id: userInfo.attributes.sub }));
        console.log(userData);
        if(!userData.data.getUser) {
          const user = {
            id: userInfo.attributes.sub,
            username: userInfo.username,
            name: userInfo.username,
            email: userInfo.attributes.email,
            image: getRandomImage(),
          }
          await saveUserToDB(user);
        } else {
          console.log('User already exists');
        }
      }
    }
    updateUser();
  }, [])

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <SafeAreaProvider>
        <Navigation colorScheme={colorScheme} />
        <StatusBar />
      </SafeAreaProvider>
    );
  }
}

export default withAuthenticator(App);