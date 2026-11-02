import { describe, it, expect } from "vitest";
import type { PublishingStatus } from "@/types/database.types";

describe("Sprint 03: Seguridad de Establecimientos, Moderación y Ubicación Segregada", () => {
  describe("Trigger check_establishment_publication_eligibility", () => {
    interface EstablishmentRecord {
      id: string;
      host_id: string;
      ubigeo_code: string;
      publishing_status: PublishingStatus;
      is_active: boolean;
    }

    interface DistrictRecord {
      ubigeo_code: string;
      is_launch_zone: boolean;
    }

    function simulatePublicationTrigger(
      oldRecord: EstablishmentRecord | null,
      newRecord: EstablishmentRecord,
      callerId: string,
      callerIsSuperadmin: boolean,
      district: DistrictRecord
    ): { allowed: boolean; errorCode?: string; message?: string } {
      // 1. Un anfitrión común no puede autoaprobar su establecimiento
      if (!callerIsSuperadmin) {
        const isApproving = newRecord.publishing_status === "APPROVED" || newRecord.publishing_status === "SUSPENDED";
        const wasDifferent = !oldRecord || oldRecord.publishing_status !== newRecord.publishing_status;
        if (isApproving && wasDifferent) {
          return {
            allowed: false,
            errorCode: "42501",
            message: "Violación de seguridad: La aprobación de un establecimiento requiere intervención de la administración.",
          };
        }
      }

      // 2. El establecimiento solo puede tener is_active = TRUE si está APROBADO
      if (newRecord.is_active === true && newRecord.publishing_status !== "APPROVED") {
        return {
          allowed: false,
          errorCode: "22023",
          message: "Restricción de negocio: Un establecimiento no puede activarse sin haber sido formalmente aprobado.",
        };
      }

      // 3. Verificar que el distrito pertenezca a una zona de lanzamiento habilitada
      if (newRecord.is_active === true && !district.is_launch_zone) {
        return {
          allowed: false,
          errorCode: "22023",
          message: "Restricción geográfica: El distrito seleccionado no forma parte de la zona de lanzamiento habilitada actualmente.",
        };
      }

      return { allowed: true };
    }

    const launchDistrict: DistrictRecord = {
      ubigeo_code: "150123", // Pachacámac
      is_launch_zone: true,
    };

    const nonLaunchDistrict: DistrictRecord = {
      ubigeo_code: "160101", // Iquitos (habilitación futura)
      is_launch_zone: false,
    };

    it("bloquea con error 42501 a un anfitrión que intente autoaprobar su local", () => {
      const draft: EstablishmentRecord = {
        id: "est-1",
        host_id: "host-1",
        ubigeo_code: "150123",
        publishing_status: "DRAFT",
        is_active: false,
      };

      const maliciousAttempt: EstablishmentRecord = {
        ...draft,
        publishing_status: "APPROVED",
      };

      const result = simulatePublicationTrigger(
        draft,
        maliciousAttempt,
        "host-1",
        false, // No es superadmin
        launchDistrict
      );

      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("42501");
      expect(result.message).toContain("intervención de la administración");
    });

    it("bloquea con error 22023 activar un establecimiento en estado Borrador", () => {
      const draft: EstablishmentRecord = {
        id: "est-2",
        host_id: "host-2",
        ubigeo_code: "150123",
        publishing_status: "DRAFT",
        is_active: false,
      };

      const activateAttempt: EstablishmentRecord = {
        ...draft,
        is_active: true,
      };

      const result = simulatePublicationTrigger(
        draft,
        activateAttempt,
        "host-2",
        false,
        launchDistrict
      );

      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("22023");
      expect(result.message).toContain("sin haber sido formalmente aprobado");
    });

    it("bloquea con error 22023 activar un local aprobado si está fuera de la zona de lanzamiento", () => {
      const draft: EstablishmentRecord = {
        id: "est-3",
        host_id: "host-3",
        ubigeo_code: "160101", // Fuera de launch zone
        publishing_status: "APPROVED",
        is_active: true,
      };

      const result = simulatePublicationTrigger(
        null,
        draft,
        "admin-1",
        true, // Es superadmin
        nonLaunchDistrict
      );

      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("22023");
      expect(result.message).toContain("no forma parte de la zona de lanzamiento");
    });

    it("permite a un Superadmin aprobar y activar un local en zona de lanzamiento", () => {
      const reviewEst: EstablishmentRecord = {
        id: "est-4",
        host_id: "host-4",
        ubigeo_code: "150123",
        publishing_status: "SUBMITTED_FOR_REVIEW",
        is_active: false,
      };

      const approvedEst: EstablishmentRecord = {
        ...reviewEst,
        publishing_status: "APPROVED",
        is_active: true,
      };

      const result = simulatePublicationTrigger(
        reviewEst,
        approvedEst,
        "admin-1",
        true,
        launchDistrict
      );

      expect(result.allowed).toBe(true);
    });
  });

  describe("Segregación RLS de establishment_locations_private", () => {
    interface ReservationCheck {
      clientId: string;
      status: string;
    }

    function simulateLocationPrivateRls(
      establishmentHostId: string,
      callerId: string,
      callerIsSuperadmin: boolean,
      reservations: ReservationCheck[]
    ): boolean {
      // 1. Anfitrión propietario
      if (establishmentHostId === callerId) return true;

      // 2. Superadministrador
      if (callerIsSuperadmin) return true;

      // 3. Cliente con reserva confirmada o en progreso
      const hasConfirmedBooking = reservations.some(
        (r) => r.clientId === callerId && (r.status === "CONFIRMED" || r.status === "IN_PROGRESS")
      );

      return hasConfirmedBooking;
    }

    it("permite al anfitrión propietario leer la dirección física exacta de su local", () => {
      const canAccess = simulateLocationPrivateRls("host-10", "host-10", false, []);
      expect(canAccess).toBe(true);
    });

    it("bloquea a usuarios anónimos o clientes no confirmados la lectura de la dirección exacta", () => {
      // Usuario visitante sin reserva
      expect(simulateLocationPrivateRls("host-10", "client-99", false, [])).toBe(false);

      // Cliente con reserva solo en REQUESTED (aún no aceptada ni pagada)
      const pendingReservations = [{ clientId: "client-99", status: "REQUESTED" }];
      expect(simulateLocationPrivateRls("host-10", "client-99", false, pendingReservations)).toBe(false);

      // Cliente con solicitud EXPIRADA
      const expiredReservations = [{ clientId: "client-99", status: "EXPIRED_NO_PAYMENT" }];
      expect(simulateLocationPrivateRls("host-10", "client-99", false, expiredReservations)).toBe(false);
    });

    it("revela la dirección exacta a un cliente con reserva CONFIRMED o IN_PROGRESS", () => {
      const confirmedReservations = [{ clientId: "client-88", status: "CONFIRMED" }];
      expect(simulateLocationPrivateRls("host-10", "client-88", false, confirmedReservations)).toBe(true);

      const inProgressReservations = [{ clientId: "client-77", status: "IN_PROGRESS" }];
      expect(simulateLocationPrivateRls("host-10", "client-77", false, inProgressReservations)).toBe(true);
    });

    it("permite al Superadministrador auditar la dirección exacta para verificación e inspección", () => {
      expect(simulateLocationPrivateRls("host-10", "admin-01", true, [])).toBe(true);
    });
  });
});
