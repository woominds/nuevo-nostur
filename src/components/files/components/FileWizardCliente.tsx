import type {
  Cliente
} from "../../../store/filesStore";

import {
  FieldLabel,
  NosturSelect,
  TextInput
} from "./FileFormControls";

import type {
  FileWizardDraft,
  SelectOption
} from "../filesModel";

type FileWizardClienteProps = {
  draft: FileWizardDraft;
  clientesSearch: Cliente[];
  metodoOptions: SelectOption[];
  vendedorOptions: SelectOption[];
  sucursalOptions: SelectOption[];
  canManageFiles: boolean;

  onPhoneChange: (
    prefix: string,
    local: string
  ) => void;

  onSelectCliente: (
    cliente: Cliente
  ) => void;

  onClienteChange: <
    K extends keyof FileWizardDraft["cliente"]
  >(
    key: K,
    value: FileWizardDraft["cliente"][K]
  ) => void;
};

export function FileWizardCliente({
  draft,
  clientesSearch,
  metodoOptions,
  vendedorOptions,
  sucursalOptions,
  canManageFiles,
  onPhoneChange,
  onSelectCliente,
  onClienteChange
}: FileWizardClienteProps) {
  return (
    <section>
      <h3 className="mb-3 text-[14px] font-semibold text-[#172033]">
        Paso 1 · Cliente
      </h3>

      <div className="grid gap-3 lg:grid-cols-[110px_1fr]">
        <div>
          <FieldLabel>
            Prefijo
          </FieldLabel>

          <TextInput
            value={draft.phonePrefix}
            onChange={(value) =>
              onPhoneChange(
                value,
                draft.phoneLocal
              )
            }
            placeholder="+549"
          />
        </div>

        <div>
          <FieldLabel>
            Teléfono
          </FieldLabel>

          <TextInput
            value={draft.phoneLocal}
            onChange={(value) =>
              onPhoneChange(
                draft.phonePrefix,
                value
              )
            }
            placeholder="3511234567"
            inputMode="tel"
          />
        </div>
      </div>

      {clientesSearch.length > 0 ? (
        <div className="mt-3">
          <FieldLabel>
            Clientes encontrados
          </FieldLabel>

          <div className="grid gap-1.5">
            {clientesSearch.map(
              (cliente) => (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() =>
                    onSelectCliente(
                      cliente
                    )
                  }
                  className={[
                    "rounded-[12px] border px-3 py-2 text-left transition",
                    draft.cliente.id ===
                    cliente.id
                      ? "border-[#4f7c90]/50 bg-[#eef6f7]"
                      : "border-black/10 bg-[#f8fafc] hover:bg-white"
                  ].join(" ")}
                >
                  <div className="text-[12px] font-semibold text-[#172033]">
                    {
                      cliente.nombre_completo
                    }
                  </div>

                  <div className="text-[11.5px] text-[#64748b]">
                    {cliente.telefono} ·{" "}
                    {cliente.email ||
                      "sin email"}
                  </div>
                </button>
              )
            )}
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <FieldLabel>
            Nombre completo *
          </FieldLabel>

          <TextInput
            value={
              draft.cliente
                .nombre_completo
            }
            onChange={(value) =>
              onClienteChange(
                "nombre_completo",
                value
              )
            }
            placeholder="Nombre y apellido"
          />
        </div>

        <div>
          <FieldLabel>
            Email
          </FieldLabel>

          <TextInput
            value={
              draft.cliente.email
            }
            onChange={(value) =>
              onClienteChange(
                "email",
                value
              )
            }
            placeholder="cliente@email.com"
            inputMode="email"
          />
        </div>

        <div>
          <FieldLabel>
            Método de contacto
          </FieldLabel>

          <NosturSelect
            value={
              draft.cliente.origen
            }
            onChange={(value) =>
              onClienteChange(
                "origen",
                value
              )
            }
            options={
              metodoOptions
            }
            placeholder="Buscar origen"
          />
        </div>

        {canManageFiles ? (
          <>
            <div>
              <FieldLabel>
                Vendedor
              </FieldLabel>

              <NosturSelect
                value={
                  draft.cliente
                    .vendedor_id
                }
                onChange={(value) =>
                  onClienteChange(
                    "vendedor_id",
                    value
                  )
                }
                options={
                  vendedorOptions
                }
                placeholder="Buscar vendedor"
              />
            </div>

            <div>
              <FieldLabel>
                Sucursal
              </FieldLabel>

              <NosturSelect
                value={
                  draft.cliente
                    .sucursal_id
                }
                onChange={(value) =>
                  onClienteChange(
                    "sucursal_id",
                    value
                  )
                }
                options={
                  sucursalOptions
                }
                placeholder="Buscar sucursal"
              />
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
