import type React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mcw/ui";
import { AppointmentTypeSelector } from "./appointment-type-selector";
import { ClientSelector } from "./client-selector";
import { AppointmentDetails } from "./appointment-details";

interface AppointmentTabsProps {
  selectedDate: Date;
  selectedTime: string;
  onCreateClient: () => void;
}

export const AppointmentTabs: React.FC<AppointmentTabsProps> = ({
  selectedDate,
  selectedTime,
  onCreateClient,
}) => {
  const appointmentDate = `${selectedDate.toLocaleDateString()} @ ${selectedTime}`;

  return (
    <Tabs className="w-full" defaultValue="appointment">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="appointment">Appointment</TabsTrigger>
        <TabsTrigger value="event">Event</TabsTrigger>
        <TabsTrigger value="out-of-office">Out of office</TabsTrigger>
      </TabsList>
      <TabsContent className="mt-4 space-y-4" value="appointment">
        <AppointmentTypeSelector />
        <ClientSelector
          appointmentDate={appointmentDate}
          onCreateClient={onCreateClient}
        />
        <AppointmentDetails
          selectedDate={selectedDate}
          selectedTime={selectedTime}
        />
      </TabsContent>
    </Tabs>
  );
};
