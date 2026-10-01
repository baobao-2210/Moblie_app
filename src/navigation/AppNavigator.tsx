import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/report";

import { HomeScreen } from "../screens/HomeScreen";
import { CreateReportScreen } from "../screens/CreateReportScreen";
import { ReportResultScreen } from "../screens/ReportResultScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { ReportDetailScreen } from "../screens/ReportDetailScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateReport" component={CreateReportScreen} />
        <Stack.Screen name="ReportResult" component={ReportResultScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
