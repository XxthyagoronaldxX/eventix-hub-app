import { Dices, LayoutDashboard, ScanLine, Settings, Ticket, Wallet } from "lucide-react";
import type { ActiveOrganization, CurrentUser, OrganizationEvent } from "@/lib/api/types";
import { eventHasDraw } from "@/lib/event-kinds";
import { eventPath, eventRoutes } from "@/lib/event-routes";
import { EventSwitcher } from "./event-switcher";
import { groupsAllowedFor, type NavigationGroup, Sidebar } from "./sidebar";

function eventGroups(event: OrganizationEvent): NavigationGroup[] {
  const eventId = event.id;
  return [
    {
      title: "Evento",
      links: [
        { href: eventRoutes.overview(eventId), label: "Visão geral", icon: LayoutDashboard, exact: true },
        {
          href: eventRoutes.tickets(eventId),
          label: "Tickets",
          icon: Ticket,
          requiredScope: "org:tickets:read",
          activePrefixes: [eventPath(eventId, "batches")],
        },
      ],
    },
    {
      title: "Operação",
      links: [
        { href: eventRoutes.payments(eventId), label: "Caixa", icon: Wallet, requiredScope: "org:tickets:payment" },
        {
          href: eventRoutes.checkIn(eventId),
          label: "Check-in",
          icon: ScanLine,
          requiredScope: "org:tickets:check-in",
        },
        ...(eventHasDraw(event)
          ? [
              {
                href: eventRoutes.draw(eventId),
                label: "Sorteio",
                icon: Dices,
                requiredScope: "org:draws:run" as const,
              },
            ]
          : []),
      ],
    },
    {
      title: "Ajustes",
      links: [
        {
          href: eventRoutes.settings(eventId),
          label: "Configurações",
          icon: Settings,
          requiredScope: "org:events:write",
        },
      ],
    },
  ];
}

interface EventSidebarProps {
  currentUser: CurrentUser;
  organization: ActiveOrganization;
  event: OrganizationEvent;
  events: OrganizationEvent[];
}

export function EventSidebar({ currentUser, organization, event, events }: EventSidebarProps) {
  return (
    <Sidebar
      currentUser={currentUser}
      header={<EventSwitcher currentEvent={event} events={events} />}
      groups={groupsAllowedFor(eventGroups(event), organization.scopes)}
    />
  );
}
