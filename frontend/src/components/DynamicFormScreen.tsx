import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  StatusBar,
} from "react-native";
import {
  fetchSheds,
  fetchFlocks,
  fetchFlocksByShed,
  fetchFeeds,
  fetchEggTypes,
  fetchBirdLossTypes,
  fetchEggTransactions,
  fetchTrips,
} from "../services/dropDownService";
import DateTimePicker from "@react-native-community/datetimepicker";
import { authPost } from "../config/api";
import { useAuth } from "../context/AuthContext";
import Snackbar from "../components/Snackbar";
import { useSnackbar } from "../hooks/useSnackbar";

// ─── API Route Mapping ────────────────────────────────────
const API_ROUTES: Record<string, string> = {
  eggproduction: "/api/transactions/egg-production",
  birdLiveStock: "/api/transactions/bird-live-stock",
  eggGodownStock: "/api/transactions/egg-godown-stock",
  eggSaleSummary: "/api/transactions/egg-sale-summary",
  feedConsumption: "/api/transactions/feed-consumption",
  feedProduction: "/api/transactions/feed-production",
  feedShedStock: "/api/transactions/feed-shed-stock",
  feedSupply: "/api/transactions/feed-supply",
  shedEggProduction: "/api/transactions/shed-egg-production",
  shedFeedReceived: "/api/transactions/shed-feed-received",
};

// ─── Fetch dropdown data by source ───────────────────────
const fetchDropdownData = async (
  apiSource: string,
  dependsOnValue?: string,
) => {
  switch (apiSource) {
    case "sheds":
      return await fetchSheds();
    case "flocks":
      return await fetchFlocks();
    case "flocksByShed":
      return dependsOnValue ? await fetchFlocksByShed(dependsOnValue) : [];
    case "feeds":
      return await fetchFeeds();
    case "eggTypes":
      return await fetchEggTypes();
    case "birdLossTypes":
      return await fetchBirdLossTypes();
    case "eggTransactions":
      return await fetchEggTransactions();
    case "trips":
      return await fetchTrips();
    default:
      return [];
  }
};

// ─── Main Screen ──────────────────────────────────────────
const DynamicFormScreen = ({ route, navigation }: any) => {
  const { title, fields, api } = route.params;
  const { user } = useAuth();
  const { snackbar, show, hide } = useSnackbar();

  const fullAccessRoles = ["SUPER_ADMIN", "ADMIN", "INCHARGE", "1"];

  const hasFullAccess = fullAccessRoles.includes(user?.role || "");

  const userSheds = user?.sheds || [];

  const lockedShed =
    !hasFullAccess && userSheds.length === 1 && userSheds[0] !== "ALL"
      ? userSheds[0]
      : null;

  const [form, setForm] = useState<any>({});
  const [showDate, setShowDate] = useState<any>({});
  const [dropdown, setDropdown] = useState<any>({
    visible: false,
    field: null,
    apiOptions: [],
  });
  const [loading, setLoading] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, any[]>>(
    {},
  );
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // ─── Load non-cascading dropdowns on mount ────────────
  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const results: Record<string, any[]> = {};
        for (const field of fields) {
          if (field.type === "dropdown_api" && !field.dependsOn) {
            results[field.name] = await fetchDropdownData(field.apiSource);
          }
        }
        setDropdownOptions((prev) => ({
          ...prev,
          ...results,
        }));
      } catch (error) {
        console.error("Failed to load dropdowns:", error);
      } finally {
        setLoadingDropdowns(false);
      }
    };
    loadDropdowns();
  }, []);

  // ─── Auto-fill locked shed and load dependent dropdowns ───
  useEffect(() => {
    const loadLockedShedData = async () => {
      if (!lockedShed) return;

      // Set shed value
      setForm((prev: any) => ({
        ...prev,
        shed_no: lockedShed,
      }));

      // Find all fields depending on shed_no
      const dependentFields = fields.filter(
        (f: any) => f.dependsOn === "shed_no",
      );

      for (const depField of dependentFields) {
        try {
          console.log(
            `Loading ${depField.name} for locked shed: ${lockedShed}`,
          );

          const data = await fetchDropdownData(depField.apiSource, lockedShed);

          console.log(
            `Fetched ${depField.name}:`,
            JSON.stringify(data, null, 2),
          );

          setDropdownOptions((prev) => ({
            ...prev,
            [depField.name]: data,
          }));
        } catch (err) {
          console.error(`Failed loading ${depField.name}:`, err);
        }
      }
    };

    loadLockedShedData();
  }, [lockedShed, fields]);

  // ─── Set value ────────────────────────────────────────
  const setValue = (key: string, value: any) =>
    setForm((prev: any) => ({ ...prev, [key]: value }));

  // ─── Handle cascading dropdowns ───────────────────────
  const handleValueChange = async (fieldName: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [fieldName]: value }));

    const dependentFields = fields.filter(
      (f: any) => f.dependsOn === fieldName,
    );

    console.log(
      `Field changed: ${fieldName} = ${value}, dependents:`,
      dependentFields.map((f: any) => f.name),
    );

    for (const depField of dependentFields) {
      setForm((prev: any) => ({ ...prev, [depField.name]: "" }));
      setDropdownOptions((prev) => ({ ...prev, [depField.name]: [] }));

      try {
        console.log(
          `Loading ${depField.name} with apiSource=${depField.apiSource}, value=${value}`,
        );
        const data = await fetchDropdownData(depField.apiSource, value);
        console.log(`Loaded ${depField.name}:`, JSON.stringify(data));
        setDropdownOptions((prev) => ({ ...prev, [depField.name]: data }));
      } catch (err) {
        console.error(`Failed to load ${depField.name}:`, err);
      }
    }
  };

  // ─── Format date ──────────────────────────────────────
  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  // ─── Validation ───────────────────────────────────────
  const validate = () => {
    for (let field of fields) {
      if (field.required && !form[field.name]) {
        show(`${field.label} is required`, "warning");
        return false;
      }
    }
    return true;
  };

  // ─── Open dropdown modal ──────────────────────────────
  const openDropdown = (field: any) => {
    Keyboard.dismiss();

    console.log("field.name =", field.name);
    console.log("dropdownOptions =", dropdownOptions);
    console.log("dropdownOptions[field.name] =", dropdownOptions[field.name]);

    setDropdown({
      visible: true,
      field,
      apiOptions: dropdownOptions[field.name] || [],
    });
  };

  // ─── Submit ───────────────────────────────────────────
  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validate()) return;
    setLoading(true);

    try {
      const formattedForm: any = {};
      for (let field of fields) {
        if (field.type === "date" && form[field.name] instanceof Date) {
          formattedForm[field.name] = formatDate(form[field.name]);
        } else {
          formattedForm[field.name] = form[field.name];
        }
      }

      formattedForm["farm_name"] = "MERLA_FARMS";
      formattedForm["who_created"] = user?.userId || "APP_USER";

      const endpoint = API_ROUTES[api];
      if (!endpoint) {
        show(`No API mapped for: ${api}`, "error");
        return;
      }

      const result = await authPost(endpoint, formattedForm);

      if (result.success) {
        show(result.message || "Data saved successfully!", "success");
        setForm({});
        setDropdownOptions({});
      } else {
        show(
          result.error || "Something went wrong. Please try again.",
          "error",
        );
      }
    } catch (error: any) {
      console.error(error);
      const msg =
        error.message === "Session expired. Please login again."
          ? error.message
          : "Could not connect to server.\nMake sure backend is running.";
      show(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      {/* ── Form Header ── */}
      <View style={styles.formHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.formTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{title}</Text>

        {/* Loading bar */}
        {loadingDropdowns && (
          <View style={styles.loadingBar}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.loadingText}>Loading options...</Text>
          </View>
        )}

        {fields.map((field: any) => {
          // Hide transfer fields unless TRANSFERRED
          if (
            (field.name === "transfer_date" ||
              field.name === "transfer_volume") &&
            form.current_status !== "TRANSFERRED"
          )
            return null;

          return (
            <View key={field.name} style={styles.field}>
              <Text style={styles.label}>
                {field.label}
                {field.required && <Text style={styles.required}> *</Text>}
              </Text>

              {/* TEXT / NUMBER */}
              {(field.type === "text" || field.type === "number") && (
                <TextInput
                  style={styles.input}
                  keyboardType={field.type === "number" ? "numeric" : "default"}
                  placeholder={`Enter ${field.label}`}
                  value={form[field.name] || ""}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onChangeText={(val) => {
                    if (field.type === "number")
                      val = val.replace(/[^0-9]/g, "");
                    setValue(field.name, val);
                  }}
                />
              )}

              {/* DATE */}
              {field.type === "date" && (
                <>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowDate((prev: any) => ({
                        ...prev,
                        [field.name]: true,
                      }));
                    }}
                  >
                    <Text
                      style={
                        form[field.name] ? styles.dateText : styles.placeholder
                      }
                    >
                      {form[field.name]
                        ? formatDate(form[field.name])
                        : "📅 Select Date"}
                    </Text>
                  </TouchableOpacity>

                  {showDate[field.name] && (
                    <DateTimePicker
                      value={form[field.name] || new Date()}
                      mode="date"
                      maximumDate={new Date()}
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(e, date) => {
                        setShowDate((prev: any) => ({
                          ...prev,
                          [field.name]: false,
                        }));
                        if (date) setValue(field.name, date);
                      }}
                    />
                  )}
                </>
              )}

              {/* STATIC DROPDOWN */}
              {field.type === "dropdown" && (
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => {
                    Keyboard.dismiss();
                    setDropdown({
                      visible: true,
                      field,
                      apiOptions: field.options || [],
                    });
                  }}
                >
                  <Text
                    style={
                      form[field.name] ? styles.dateText : styles.placeholder
                    }
                  >
                    {form[field.name] || "Select option ▼"}
                  </Text>
                </TouchableOpacity>
              )}

              {/* API DROPDOWN */}
              {field.type === "dropdown_api" && (
                <TouchableOpacity
                  style={[
                    styles.input,
                    field.dependsOn &&
                      !form[field.dependsOn] &&
                      styles.inputDisabled,
                    field.name === "shed_no" &&
                      lockedShed &&
                      styles.inputLocked,
                  ]}
                  onPress={() => {
                    // Don't allow opening if shed is locked
                    if (field.name === "shed_no" && lockedShed) {
                      return;
                    }

                    if (field.dependsOn && !form[field.dependsOn]) {
                      show(
                        `Please select ${field.dependsOn
                          .replace("_no", "")
                          .replace("_", " ")} first`,
                        "warning",
                      );
                      return;
                    }

                    openDropdown(field);
                  }}
                >
                  <Text
                    style={
                      form[field.name] ? styles.dateText : styles.placeholder
                    }
                  >
                    {form[field.name]
                      ? form[field.name]
                      : loadingDropdowns
                        ? "Loading..."
                        : field.dependsOn && !form[field.dependsOn]
                          ? `Select ${field.dependsOn
                              .replace("_no", "")
                              .replace("_", " ")} first`
                          : "Select option ▼"}
                  </Text>
                  {field.name === "shed_no" && lockedShed && (
                    <Text style={styles.lockedIcon}>🔒</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit</Text>
          )}
        </TouchableOpacity>

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* DROPDOWN MODAL */}
      <Modal visible={dropdown.visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() =>
            setDropdown({ visible: false, field: null, apiOptions: [] })
          }
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{dropdown.field?.label}</Text>
            <FlatList
              data={dropdown.apiOptions || []}
              keyExtractor={(item, index) =>
                typeof item === "string" ? item : index.toString()
              }
              ListEmptyComponent={
                <Text style={styles.emptyText}>No options available</Text>
              }
              renderItem={({ item }) => {
                const label =
                  typeof item === "string"
                    ? item
                    : item[dropdown.field?.labelKey] || "";
                const value =
                  typeof item === "string"
                    ? item
                    : item[dropdown.field?.valueKey] || "";

                return (
                  <TouchableOpacity
                    style={[
                      styles.option,
                      form[dropdown.field?.name] === value &&
                        styles.optionSelected,
                    ]}
                    onPress={() => {
                      handleValueChange(dropdown.field.name, value);
                      setDropdown({
                        visible: false,
                        field: null,
                        apiOptions: [],
                      });
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        form[dropdown.field?.name] === value &&
                          styles.optionTextSelected,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={hide}
      />
    </KeyboardAvoidingView>
  );
};

export default DynamicFormScreen;

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: "#f3f4f6" },
  container: { padding: 16, paddingBottom: 40 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    color: "#1e3a5f",
  },
  loadingBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  loadingText: { color: "#6b7280", fontSize: 13 },
  field: { marginBottom: 14 },
  label: { marginBottom: 4, fontWeight: "500", color: "#374151" },
  required: { color: "#ef4444" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    minHeight: 44,
    justifyContent: "center",
  },
  inputDisabled: { backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" },
  inputLocked: {
    backgroundColor: "#f3f4f6",
    borderColor: "#d1d5db",
  },

  lockedIcon: {
    position: "absolute",
    right: 12,
    top: 12,
    fontSize: 14,
  },
  dateText: { color: "#111827" },
  placeholder: { color: "#9ca3af" },
  button: {
    backgroundColor: "#2563eb",
    padding: 14,
    marginTop: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#93c5fd" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    maxHeight: 350,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    padding: 10,
    color: "#1e3a5f",
    textAlign: "center",
  },
  option: {
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
  },
  formHeader: {
    backgroundColor: "#1e3a5f",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 14 : 14,
  },
  backBtn: { width: 40, justifyContent: "center" },
  backIcon: { fontSize: 22, color: "#fff", fontWeight: "600" },
  formTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  optionSelected: { backgroundColor: "#dbeafe" },
  optionText: { color: "#111827" },
  optionTextSelected: { color: "#2563eb", fontWeight: "600" },
  emptyText: { textAlign: "center", padding: 20, color: "#9ca3af" },
});
