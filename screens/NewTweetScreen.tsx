import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput, 
  Platform,
  Image,
} from 'react-native';
import { API, Auth, graphqlOperation, Storage } from 'aws-amplify';

import * as ImagePicker from 'expo-image-picker';
import { Text, View } from '../components/Themed';
import { v4 as uuidv4 } from 'uuid';


import { AntDesign } from '@expo/vector-icons';
import Colors from "../constants/Colors";
import ProfilePicture from '../components/ProfilePicture';
import { createTweet } from '../src/graphql/mutations';
import { useNavigation } from '@react-navigation/native';
import * as Permissions from 'expo-permissions';

export default function NewTweetScreen() {

  const [tweet, setTweet] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const navigation = useNavigation();

  const getPermissionAsync = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
      }
    }
  };
  
  useEffect(() => {
    getPermissionAsync()
  }, [])

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.cancelled) {
        setImageUrl(result.uri);
      }

      console.log(result);
    } catch (E) {
      console.log(E);
    }
  };

  const uploadImage = async () => {
    try {
      const response = await fetch(imageUrl);

      const blob = await response.blob();

      const urlParts = imageUrl.split('.');
      const extension = urlParts[urlParts.length - 1];

      const key = `${uuidv4()}.${extension}`; 

      await Storage.put(key, blob);

      return key;

    } catch (e) {
      console.log(e);
    }
    return '';
  }

  const onPostTweet = async () => {
    let image;
    if (!!imageUrl) {
      image = await uploadImage();
    }

    try {
      const currentUser = await Auth.currentAuthenticatedUser({ bypassCache: true });

      const newTweet = {
        content: tweet,
        image,
        userID: currentUser.attributes.sub,
      }
      await API.graphql(graphqlOperation(createTweet, { input: newTweet }));
      navigation.goBack();
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="close" size={30} color={Colors.light.tint} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onPostTweet}>
          <Text style={styles.buttonText}>Tweet</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.newTweetContainer}>
        <ProfilePicture image={'https://i.insider.com/5d03aa8e6fc9201bc7002b43?width=1136&format=jpeg'} />
        <View style={styles.inputsContainer}>
          <TextInput
          value={tweet}
          onChangeText={(value) => setTweet(value)}
          multiline={true} 
          numberOfLines={3} 
          style={styles.tweetInput} 
          placeholder={"Whats happening?"} />

          <TouchableOpacity onPress={pickImage}>
            <Text style={styles.pickImage}>Pick a image</Text>
          </TouchableOpacity>

          <Image source={{ uri: imageUrl }} style={styles.image} />
       </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'flex-start',
    backgroundColor: "white",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    padding: 15
  },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 30,
  },
  buttonText: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    color: "white",
    fontWeight: 'bold',
    fontSize: 16,
  },
  newTweetContainer: {
    flexDirection: "row",
    padding: 15,
  },
  inputsContainer: {
    marginLeft: 10,
  },
  tweetInput: {
    height: 100,
    maxHeight: 300,
    fontSize: 18,
  },
  pickImage: {
    fontSize: 18,
    color: Colors.light.tint,
    marginVertical: 10,
  },
  image: {
    width: 150,
    height: 150,
  }
});
