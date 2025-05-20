import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setAuthToken } from "../utils/api";

export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email is required");
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (password) => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔐 Logging in with:", email);
      const res = await api.post("/api/auth/login", {
        email,
        password,
      });

      const { token } = res.data;

      await AsyncStorage.setItem("token", token);
//      await AsyncStorage.setItem("userId", String(user.id));
//      await AsyncStorage.setItem("email", user.email);
//      await AsyncStorage.setItem("name", user.name);
      setAuthToken(token);

      navigation.navigate("SelectHome");
    } catch (error) {
      console.error("❌ Login error:", error.response?.data || error.message);

      let errorMessage =
        error.response?.data?.error ||
        "Login failed. Please check your credentials and try again.";

      Alert.alert("Login Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.welcomeSection}>
            <Text style={styles.title}>AUTOHOME.GLOBAL</Text>
            <Text style={styles.subtitle}>Login to your account</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="Enter your email"
                keyboardType="email-address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) validateEmail(text);
                }}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                returnKeyType="next"
                placeholderTextColor="#718096"
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={[styles.input, passwordError ? styles.inputError : null]}
                placeholder="Enter your password"
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) validatePassword(text);
                }}
                autoCapitalize="none"
                autoComplete="password"
                returnKeyType="done"
                placeholderTextColor="#718096"
              />
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading ? styles.loginButtonDisabled : null]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.signupLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  welcomeSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#2d3748',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 2,
  },
  inputError: {
    borderColor: '#E53E3E',
    borderWidth: 1,
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    padding: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#4299e1',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#419CAD',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4299e1',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  loginButtonDisabled: {
    backgroundColor: '#90CDF4',
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  signupText: {
    fontSize: 14,
    color: '#718096',
  },
  signupLink: {
    fontSize: 14,
    color: '#4299e1',
    fontWeight: '600',
    marginLeft: 4,
  },
});