import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { useRole } from "../context/RoleContext";

export default function useRoleGuard(allowedRoles) {
  const { role } = useRole();
  const navigation = useNavigation();

  useEffect(() => {
    if (role && !allowedRoles.includes(role)) {
      navigation.navigate("Home");
    }
  }, [role]);
}
