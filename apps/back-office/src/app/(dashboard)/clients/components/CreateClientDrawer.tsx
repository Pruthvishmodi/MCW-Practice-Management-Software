/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useRef, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { X } from "lucide-react";
import { Sheet, SheetContent } from "@mcw/ui";
import { Button } from "@mcw/ui";
import { RadioGroup, RadioGroupItem } from "@mcw/ui";
import { Label } from "@mcw/ui";
import { ClientTabs } from "./ClientTabs";
import { ClientForm } from "./ClientForm";
import { SelectExistingClient } from "./SelectExistingClient";

interface CreateClientDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAppointmentDate?: string;
}

export interface EmailEntry {
  value: string;
  type: string;
  permission: string;
}

export interface PhoneEntry {
  value: string;
  type: string;
  permission: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

interface FormState {
  clientType: string;
  legalFirstName: string;
  legalLastName: string;
  preferredName: string;
  dob: string;
  status: string;
  addToWaitlist: boolean;
  primaryClinician: string;
  location: string;
  emails: EmailEntry[];
  phones: PhoneEntry[];
  notificationOptions: {
    upcomingAppointments: boolean;
    incompleteDocuments: boolean;
    cancellations: boolean;
  };
  contactMethod: {
    text: boolean;
    voice: boolean;
  };
  is_responsible_for_billing?: boolean;
}

interface FormValues {
  clientType: string;
  clients: Record<string, FormState>;
}

export function CreateClientDrawer({
  open,
  onOpenChange,
  defaultAppointmentDate = "Tuesday, Oct 22, 2025 @ 12:00 PM",
}: CreateClientDrawerProps) {
  const [clientType, setClientType] = useState("adult");
  const [activeTab, setActiveTab] = useState("");
  const [selectedClients, setSelectedClients] = useState<
    Record<string, Client | null>
  >({});
  const [clientTabs, setClientTabs] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, Record<string, string[]>>
  >({});

  const [showSelectExisting, setShowSelectExisting] = useState(false);

  const tabsRef = useRef<{ submit: () => void }>(null);

  const defaultClientData: FormState = {
    clientType: clientType,
    legalFirstName: "",
    legalLastName: "",
    preferredName: "",
    dob: "",
    status: "active",
    addToWaitlist: false,
    primaryClinician: "travis",
    location: "stpete",
    emails: [],
    phones: [],
    notificationOptions: {
      upcomingAppointments: true,
      incompleteDocuments: false,
      cancellations: false,
    },
    contactMethod: {
      text: true,
      voice: false,
    },
  };

  // @ts-expect-error - TODO: Fix form typing
  const form = useForm<FormValues>({
    defaultValues: {
      clientType: "minor",
      clients: {
        "client-1": { ...defaultClientData },
      },
    },
    validatorAdapter: {
      validate: (values: FormValues) => {
        // Email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Validate each client
        const clientsValidation = Object.entries(values.clients).reduce(
          (acc, [key, client]) => {
            // Skip empty clients
            console.log("🚀 ~ clientsValidation ~ client:", client);
            if (!client) return acc;

            const clientErrors: Record<string, string> = {};

            // Required field validations
            if (!client.legalFirstName || client.legalFirstName.trim() === "") {
              clientErrors.legalFirstName = "First name is required";
            }

            if (!client.legalLastName || client.legalLastName.trim() === "") {
              clientErrors.legalLastName = "Last name is required";
            }

            // DOB validation - only for non-contact tabs
            const isContactTab =
              clientType === "minor" && activeTab === "client-2";
            if (!isContactTab && (!client.dob || client.dob.trim() === "")) {
              clientErrors.dob = "Date of Birth is required";
            }

            // For contact tab in minor client type, validate is_responsible_for_billing
            if (
              isContactTab &&
              client.is_responsible_for_billing === undefined
            ) {
              clientErrors.is_responsible_for_billing =
                "Please specify if contact is responsible for billing";
            }

            // Contact method validation
            const hasValidEmail =
              client.emails &&
              client.emails.length > 0 &&
              client.emails.some(
                (e) => e.value.trim() !== "" && emailRegex.test(e.value),
              );

            const hasPhone =
              client.phones &&
              client.phones.length > 0 &&
              client.phones.some((p) => p.value.trim() !== "");

            if (!hasValidEmail && !hasPhone) {
              clientErrors.emails =
                "At least one valid contact method (email or phone) is required";
            }

            // Add errors for this client if any were found
            if (Object.keys(clientErrors).length > 0) {
              acc[key] = { meta: { errors: clientErrors } };
            }

            return acc;
          },
          {} as Record<string, any>,
        );

        return {
          clientType: values.clientType,
          clients: clientsValidation,
        };
      },
    },
    onSubmit: async ({ value }) => {
      console.log("🚀 ~ onSubmit: ~ value:", value);
      const structuredData = structureData(value);
      console.log("Form submitted:", structuredData);
    },
  });

  useEffect(() => {
    let initialTabs;
    let initialClients: Record<string, FormState>;

    switch (clientType) {
      case "minor":
        initialTabs = [
          { id: "client-1", label: "Client" },
          { id: "client-2", label: "Contact" },
        ];
        initialClients = {
          "client-1": { ...defaultClientData, clientType },
          "client-2": { ...defaultClientData, clientType },
        };
        break;
      case "couple":
        initialTabs = [
          { id: "client-1", label: "Client 1" },
          { id: "client-2", label: "Client 2" },
        ];
        initialClients = {
          "client-1": { ...defaultClientData, clientType },
          "client-2": { ...defaultClientData, clientType },
        };
        break;
      case "family":
        initialTabs = [{ id: "client-1", label: "Client 1" }];
        initialClients = {
          "client-1": { ...defaultClientData, clientType },
        };
        break;
      case "adult":
      default:
        initialTabs = [{ id: "client-1", label: "Client" }];
        initialClients = {
          "client-1": { ...defaultClientData, clientType },
        };
    }

    setClientTabs(initialTabs);
    setActiveTab("client-1");

    // First set the client type
    form.setFieldValue("clientType", clientType);

    // Then set each client individually to ensure proper state updates
    Object.entries(initialClients).forEach(([key, value]) => {
      form.setFieldValue(`clients.${key}`, value);
    });

    // Reset form state to only include the initial clients
    form.setFieldValue("clients", initialClients);

    setSelectedClients({});
  }, [clientType]);

  const structureData = (values: FormValues) => {
    // Filter out empty or undefined client objects
    const filteredClients = Object.entries(values.clients).reduce(
      (acc, [key, value]) => {
        if (value && Object.keys(value).length > 0) {
          const clientNum = key.split("-")[1] || "1";
          acc[`client${clientNum}`] = value;
        }
        return acc;
      },
      {} as Record<string, FormState>,
    );

    return filteredClients;
  };

  const handleSelectExistingClient = (selectedClientParam: Client) => {
    // Store selected client for the current tab only
    setSelectedClients((prev) => ({
      ...prev,
      [activeTab]: selectedClientParam,
    }));

    const [firstName, lastName] = selectedClientParam.name.split(" ");
    const mappedClient: FormState = {
      clientType: clientType,
      legalFirstName: firstName || "",
      legalLastName: lastName || "",
      preferredName: "",
      dob: "",
      status: "active",
      addToWaitlist: false,
      primaryClinician: "travis",
      location: "stpete",
      emails: [
        {
          value: selectedClientParam.email,
          type: "primary",
          permission: "allowed",
        },
      ],
      phones: [],
      notificationOptions: {
        upcomingAppointments: true,
        incompleteDocuments: false,
        cancellations: false,
      },
      contactMethod: {
        text: true,
        voice: false,
      },
    };

    // Only set the active tab's data
    form.setFieldValue(`clients.${activeTab}`, mappedClient);
    setShowSelectExisting(false);
  };

  const handleClientRemoved = () => {
    // Remove selected client for active tab only
    setSelectedClients((prev) => {
      const updated = { ...prev };
      delete updated[activeTab];
      return updated;
    });
  };

  // Function to clear validation error for a specific field in a specific tab
  const clearValidationError = (tabId: string, fieldName: string) => {
    if (validationErrors[tabId]?.[fieldName]) {
      setValidationErrors((prev) => {
        const updatedErrors = { ...prev };
        if (updatedErrors[tabId]) {
          const updatedTabErrors = { ...updatedErrors[tabId] };
          delete updatedTabErrors[fieldName];
          updatedErrors[tabId] = updatedTabErrors;
        }
        return updatedErrors;
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="sm:max-w-[500px] p-0 gap-0 [&>button]:hidden"
        side="right"
      >
        {showSelectExisting ? (
          <SelectExistingClient
            selectedClient={selectedClients[activeTab] || null}
            onBack={() => setShowSelectExisting(false)}
            onSelect={handleSelectExistingClient}
          />
        ) : (
          <>
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="text-xl font-semibold">Create client</h2>
                <p className="text-sm text-gray-500">
                  Appointment: {defaultAppointmentDate}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className="h-8 w-8"
                  size="icon"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
                <Button
                  className="bg-[#2d8467] hover:bg-[#236c53]"
                  onClick={() => {
                    // Manual validation for active tab only
                    const formData = form.getFieldValue("clients");
                    const currentTabErrors: Record<string, string[]> = {};
                    let isValid = true;

                    const currentTabClient = formData
                      ? formData[activeTab]
                      : null;

                    if (currentTabClient) {
                      // Validate required fields
                      if (
                        !currentTabClient.legalFirstName ||
                        currentTabClient.legalFirstName.trim() === ""
                      ) {
                        currentTabErrors.legalFirstName = [
                          "First name is required",
                        ];
                        isValid = false;
                      }

                      if (
                        !currentTabClient.legalLastName ||
                        currentTabClient.legalLastName.trim() === ""
                      ) {
                        currentTabErrors.legalLastName = [
                          "Last name is required",
                        ];
                        isValid = false;
                      }

                      // DOB validation - only for non-contact tabs
                      const isContactTab =
                        clientType === "minor" && activeTab === "client-2";
                      if (
                        !isContactTab &&
                        (!currentTabClient.dob ||
                          currentTabClient.dob.trim() === "")
                      ) {
                        currentTabErrors.dob = ["Date of Birth is required"];
                        isValid = false;
                      }
                      // Email validation regex
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                      // Contact method validation
                      const hasValidEmail =
                        currentTabClient.emails &&
                        currentTabClient.emails.length > 0 &&
                        currentTabClient.emails.some(
                          (e: EmailEntry) =>
                            e.value.trim() !== "" && emailRegex.test(e.value),
                        );

                      const hasPhone =
                        currentTabClient.phones &&
                        currentTabClient.phones.length > 0 &&
                        currentTabClient.phones.some(
                          (p: PhoneEntry) => p.value.trim() !== "",
                        );

                      if (!hasValidEmail && !hasPhone) {
                        currentTabErrors.emails = [
                          "At least one valid contact method (email or phone) is required",
                        ];
                        isValid = false;
                      }

                      // Update validation errors in state - only update for the active tab
                      setValidationErrors((prev) => ({
                        ...prev,
                        [activeTab]:
                          Object.keys(currentTabErrors).length > 0
                            ? currentTabErrors
                            : {},
                      }));

                      if (isValid) {
                        // If all tabs are valid, then submit
                        let allTabsValid = true;

                        // Check if we need to validate all tabs or just the current one
                        if (clientType !== "adult") {
                          // For family, couple, or minor types, validate all tabs
                          for (const tab of clientTabs) {
                            const tabClient = formData?.[tab.id];
                            if (!tabClient) {
                              allTabsValid = false;
                              setActiveTab(tab.id);
                              break;
                            }

                            const isContactTabCheck =
                              clientType === "minor" && tab.id === "client-2";

                            // Basic validation for all tabs
                            if (
                              !tabClient.legalFirstName ||
                              !tabClient.legalLastName
                            ) {
                              allTabsValid = false;
                              setActiveTab(tab.id);
                              break;
                            }

                            // DOB validation only for non-contact tabs
                            if (!isContactTabCheck && !tabClient.dob) {
                              allTabsValid = false;
                              setActiveTab(tab.id);
                              break;
                            }

                            // Contact method validation for all tabs
                            if (
                              !(
                                tabClient.emails?.some(
                                  (e: EmailEntry) => e.value.trim() !== "",
                                ) ||
                                tabClient.phones?.some(
                                  (p: PhoneEntry) => p.value.trim() !== "",
                                )
                              )
                            ) {
                              allTabsValid = false;
                              setActiveTab(tab.id);
                              break;
                            }
                          }
                        }

                        if (allTabsValid) {
                          form.handleSubmit();
                        }
                      }
                    }
                  }}
                >
                  Continue
                </Button>
              </div>
            </div>

            <div className="space-y-6 overflow-y-auto h-[calc(100vh-72px)]">
              {/* Client Type */}
              <div className="px-6 pt-6">
                <RadioGroup
                  className="flex gap-4"
                  defaultValue="minor"
                  value={clientType}
                  onValueChange={(newClientType) => {
                    setClientType(newClientType);
                    // Clear all validation errors when changing client type
                    setValidationErrors({});
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="adult" value="adult" />
                    <Label htmlFor="adult">Adult</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="minor" value="minor" />
                    <Label htmlFor="minor">Minor</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="couple" value="couple" />
                    <Label htmlFor="couple">Couple</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="family" value="family" />
                    <Label htmlFor="family">Family</Label>
                  </div>
                </RadioGroup>
              </div>
              {clientType !== "adult" ? (
                <ClientTabs
                  ref={tabsRef}
                  activeTab={activeTab}
                  clearValidationError={(fieldName) =>
                    clearValidationError(activeTab, fieldName)
                  }
                  clientTabs={clientTabs}
                  clientType={clientType}
                  form={form}
                  selectedClient={selectedClients[activeTab] || null}
                  setActiveTab={setActiveTab}
                  setClientTabs={setClientTabs}
                  validationErrors={validationErrors[activeTab] || {}}
                  onClientRemoved={handleClientRemoved}
                  onSelectExisting={setShowSelectExisting}
                />
              ) : (
                <form.Field name="clients.client-1">
                  {(field: any) => (
                    <ClientForm
                      clearValidationError={(fieldName) =>
                        clearValidationError("client-1", fieldName)
                      }
                      clientType={clientType}
                      field={field}
                      selectedClient={selectedClients["client-1"] || null}
                      tabId="client-1"
                      validationErrors={validationErrors["client-1"] || {}}
                    />
                  )}
                </form.Field>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
