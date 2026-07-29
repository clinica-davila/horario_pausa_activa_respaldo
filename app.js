// ---------- Conexión con Supabase ----------
    const SUPABASE_URL = "https://gfeqnqaaruadocgddhyl.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_IBQ6XkpiSMPzTE6GXzT2KA_crp15-H4";
    const db = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth:{
          persistSession:true,
          autoRefreshToken:true,
          detectSessionInUrl:true
        }
      }
    );

    let registroHorarioId = null;
    let appInicializada = false;

    // ---------- Datos originales (desde los Excel de Semana 1 y Semana 2) ----------
    const edificios = ["A","B","C","D","G","H","I"];
    const horasBase = ["09:00 - 10:00","10:00 - 11:00","11:00 - 12:00","12:00 - 12:30","14:00 - 15:00","15:00 - 16:00","16:00 - 16:30"];
    const diasBase = ["Lunes","Martes","Miércoles","Jueves","Viernes"];

    function filaVacia(hora){
      const f = { hora };
      edificios.forEach(e => f[e] = "");
      return f;
    }

    function construirSemana(datos){
      const semana = {};
      diasBase.forEach(dia => {
        semana[dia] = horasBase.map(h => {
          const base = filaVacia(h);
          const override = (datos[dia] && datos[dia][h]) || {};
          Object.keys(override).forEach(ed => base[ed] = override[ed]);
          return base;
        });
      });
      return semana;
    }

    const datosOriginales = {
      1: construirSemana({
        Lunes: {
          "09:00 - 10:00": { H:"Vacunatorio" },
          "11:00 - 12:00": { H:"Control Financiero\nMarketing\nDirección Médica" },
          "12:00 - 12:30": { H:"Estación de Enfermería" },
          "14:00 - 15:00": { A:"Laboratorio Cardiología", C:"Logística" }
        },
        Martes: {
          "10:00 - 11:00": { C:"Servicio al Cliente" },
          "11:00 - 12:00": { A:"Laboratorio Cardiología" },
          "15:00 - 16:00": { C:"Cobranza Judicial", D:"Cuidados Paliativos" },
          "16:00 - 16:30": { G:"UPC Pediátrica" }
        },
        "Miércoles": {
          "11:00 - 12:00": { D:"Contact Center" },
          "12:00 - 12:30": { D:"Anatomía Patológica" },
          "16:00 - 16:30": { G:"UPC Pediátrica" }
        },
        Jueves: {
          "09:00 - 10:00": { C:"Abastecimiento" },
          "10:00 - 11:00": { B:"Infraestructura", G:"Bodega Pabellón Maternidad" },
          "15:00 - 16:00": { A:"Laboratorio Respiratorio", C:"Central de Cajas" },
          "16:00 - 16:30": { H:"Centro de Infusión" }
        },
        Viernes: {
          "11:00 - 12:00": { D:"Pabellón Central", G:"Neonatología" },
          "12:00 - 12:30": { B:"Equipos Médicos", I:"Gerencia de Personas" },
          "15:00 - 16:00": { C:"Cierre de Cuentas", G:"UPC Pediátrica" },
          "16:00 - 16:30": { A:"Urología" }
        }
      }),
      2: construirSemana({
        Lunes: {
          "09:00 - 10:00": { C:"Deuda Pública" },
          "10:00 - 11:00": { C:"GES CAEC" },
          "12:00 - 12:30": { B:"Infraestructura" },
          "14:00 - 15:00": { I:"Centro del Cáncer Ambulatorio" }
        },
        Martes: {
          "10:00 - 11:00": { A:"Unidad de Registros Clínicos" },
          "15:00 - 16:00": { C:"Experiencia Paciente", D:"Cuidados Paliativos" },
          "16:00 - 16:30": { G:"Pediatría" }
        },
        "Miércoles": {
          "09:00 - 10:00": { C:"Facturación" },
          "10:00 - 11:00": { B:"Servicio al Cliente", H:"Bodega Central" },
          "11:00 - 12:00": { H:"Estación de Enfermería" },
          "14:00 - 15:00": { A:"Laboratorio Cardiología" },
          "15:00 - 16:00": { A:"Laboratorio Gastroenterología" }
        },
        Jueves: {
          "09:00 - 10:00": { C:"Ley de Urgencia", H:"Service Line" },
          "10:00 - 11:00": { H:"Investigación y Docencia" },
          "11:00 - 12:00": { D:"Consignaciones", H:"IAAS" },
          "12:00 - 12:30": { G:"Ropería" },
          "14:00 - 15:00": { I:"Centro del Cáncer Ambulatorio" },
          "15:00 - 16:00": { C:"Biblioteca", H:"Tesorería" },
          "16:00 - 16:30": { D:"Hemodinamia", G:"Pediatría" }
        },
        Viernes: {
          "09:00 - 10:00": { G:"Pabellón Maternidad" },
          "11:00 - 12:00": { C:"Cierre de Cuentas", H:"Estación de Enfermería" },
          "12:00 - 12:30": { D:"Bodega Pabellón Central" },
          "14:00 - 15:00": { A:"Laboratorio Cardiología" },
          "15:00 - 16:00": { H:"Comercial" }
        }
      })
    };

    // ---------- Estado ----------
    let horarios = JSON.parse(JSON.stringify(datosOriginales));
    let semanaActual = "1";
    let diaActual = "Lunes";
    let guardarPendiente = null;
    let cambiosPuntuales = [];
    let historialCambios = [];
    let limiteHistorial = 30;

    const botonesSemana = document.querySelectorAll(".semana-btn");
    const diasContenedor = document.getElementById("dias");
    const cuerpoTabla = document.getElementById("cuerpoTabla");
    const tituloTabla = document.getElementById("tituloTabla");
    const estadoSemana = document.getElementById("estadoSemana");
    const horarioMovil = document.getElementById("horarioMovil");
    const toast = document.getElementById("toast");
    const puntoEstado = document.getElementById("puntoEstado");
    const textoEstado = document.getElementById("textoEstado");
    const pantallaCarga = document.getElementById("pantallaCarga");
    const pantallaLogin = document.getElementById("pantallaLogin");
    const aplicacion = document.getElementById("aplicacion");
    const formLogin = document.getElementById("formLogin");
    const emailLogin = document.getElementById("emailLogin");
    const passwordLogin = document.getElementById("passwordLogin");
    const btnLogin = document.getElementById("btnLogin");
    const errorLogin = document.getElementById("errorLogin");
    const usuarioActivo = document.getElementById("usuarioActivo");

    const listaCambios = document.getElementById("listaCambios");
    const modalCambio = document.getElementById("modalCambio");
    const formCambio = document.getElementById("formCambio");
    const tituloModalCambio = document.getElementById("tituloModalCambio");
    const cambioId = document.getElementById("cambioId");
    const cambioFecha = document.getElementById("cambioFecha");
    const cambioTipo = document.getElementById("cambioTipo");
    const cambioSemana = document.getElementById("cambioSemana");
    const cambioDia = document.getElementById("cambioDia");
    const cambioEdificio = document.getElementById("cambioEdificio");
    const cambioActividad = document.getElementById("cambioActividad");
    const cambioHoraOriginal = document.getElementById("cambioHoraOriginal");
    const cambioHoraNueva = document.getElementById("cambioHoraNueva");
    const cambioMotivo = document.getElementById("cambioMotivo");
    const grupoHoraNueva = document.getElementById("grupoHoraNueva");
    const actividadesSugeridas = document.getElementById("actividadesSugeridas");

    const listaHistorial = document.getElementById("listaHistorial");
    const buscarHistorial = document.getElementById("buscarHistorial");
    const filtroAccionHistorial = document.getElementById("filtroAccionHistorial");
    const filtroEntidadHistorial = document.getElementById("filtroEntidadHistorial");
    const btnActualizarHistorial = document.getElementById("btnActualizarHistorial");
    const btnCargarMasHistorial = document.getElementById("btnCargarMasHistorial");


    function mostrarToast(msg){
      toast.textContent = msg;
      toast.classList.add("mostrar");
      setTimeout(() => toast.classList.remove("mostrar"), 2200);
    }

    function marcarPendiente(){
      puntoEstado.classList.add("pendiente");
      textoEstado.textContent = "Guardando…";
    }
    function marcarGuardado(){
      puntoEstado.classList.remove("pendiente");
      textoEstado.textContent = "Todos los cambios guardados";
    }

    // ---------- Historial de cambios ----------
    async function registrarHistorial({ accion, entidad, registroId = null, resumen, antes = null, despues = null }){
      try{
        const { data:{ user }, error:userError } = await db.auth.getUser();
        if(userError) throw userError;
        if(!user) throw new Error("No hay una sesión activa.");

        const { error } = await db
          .from("historial_cambios")
          .insert({
            usuario_id: user.id,
            usuario_email: user.email || null,
            accion,
            entidad,
            registro_id: registroId,
            resumen,
            antes,
            despues
          });

        if(error) throw error;
        await cargarHistorial(true);
      }catch(err){
        // El historial no debe impedir que el horario siga funcionando.
        console.error("Error registrando historial:", err);
      }
    }


    async function guardarEnStorage(){
      try{
        if(!registroHorarioId){
          throw new Error("No se encontró el registro del horario.");
        }

        const { error } = await db
          .from("horarios_prueba")
          .update({ datos: horarios })
          .eq("id", registroHorarioId);

        if(error) throw error;
        marcarGuardado();
      }catch(err){
        textoEstado.textContent = "No se pudo guardar (revisa tu conexión)";
        puntoEstado.classList.add("pendiente");
        console.error("Error guardando:", err);
      }
    }

    function programarGuardado(){
      marcarPendiente();
      if(guardarPendiente) clearTimeout(guardarPendiente);
      guardarPendiente = setTimeout(guardarEnStorage, 700);
    }

    async function cargarDesdeStorage(){
      try{
        textoEstado.textContent = "Cargando horario…";

        const { data, error } = await db
          .from("horarios_prueba")
          .select("id, datos")
          .order("id", { ascending:true })
          .limit(1)
          .maybeSingle();

        if(error) throw error;

        if(data){
          registroHorarioId = data.id;
          if(data.datos) horarios = data.datos;
        }else{
          const { data:nuevo, error:errorInsertar } = await db
            .from("horarios_prueba")
            .insert({ datos: horarios })
            .select("id")
            .single();

          if(errorInsertar) throw errorInsertar;
          registroHorarioId = nuevo.id;
        }

        marcarGuardado();
        renderTodo();
      }catch(err){
        textoEstado.textContent = "No se pudo cargar el horario";
        console.error("Error cargando:", err);
        mostrarToast("Error al conectar con la base de datos");
        renderTodo();
      }
    }


    function formatearFechaHoraHistorial(fecha){
      if(!fecha) return { fecha:"", hora:"" };
      const d = new Date(fecha);
      return {
        fecha: new Intl.DateTimeFormat("es-CL", { day:"2-digit", month:"2-digit", year:"numeric" }).format(d),
        hora: new Intl.DateTimeFormat("es-CL", { hour:"2-digit", minute:"2-digit" }).format(d)
      };
    }

    function etiquetaAccion(accion){
      return ({ crear:"Creado", editar:"Editado", eliminar:"Eliminado", restablecer:"Restablecido" })[accion] || accion || "Cambio";
    }

    function etiquetaEntidad(entidad){
      return entidad === "horario_base" ? "Horario base" : entidad === "cambio_puntual" ? "Cambio puntual" : entidad || "Registro";
    }

    function jsonLegible(valor){
      if(valor === null || valor === undefined) return "Sin información";
      try{ return JSON.stringify(valor, null, 2); }
      catch(_err){ return String(valor); }
    }

    async function cargarHistorial(mantenerLimite = false){
      if(!listaHistorial) return;
      if(!mantenerLimite) limiteHistorial = 30;
      listaHistorial.innerHTML = '<div class="historial-vacio">Cargando historial…</div>';

      const { data, error } = await db
        .from("historial_cambios")
        .select("id, created_at, usuario_email, accion, entidad, registro_id, resumen, antes, despues")
        .order("created_at", { ascending:false })
        .limit(limiteHistorial);

      if(error){
        console.error("Error cargando historial:", error);
        listaHistorial.innerHTML = '<div class="historial-vacio">No se pudo cargar el historial. Revisa la policy SELECT de historial_cambios.</div>';
        return;
      }

      historialCambios = data || [];
      renderHistorial();
      if(btnCargarMasHistorial){
        btnCargarMasHistorial.classList.toggle("oculto", historialCambios.length < limiteHistorial);
      }
    }

    function renderHistorial(){
      if(!listaHistorial) return;
      const texto = (buscarHistorial?.value || "").trim().toLowerCase();
      const accion = filtroAccionHistorial?.value || "";
      const entidad = filtroEntidadHistorial?.value || "";

      const filtrados = historialCambios.filter(item => {
        if(accion && item.accion !== accion) return false;
        if(entidad && item.entidad !== entidad) return false;
        if(!texto) return true;
        const bolsa = [item.resumen, item.usuario_email, item.accion, item.entidad, jsonLegible(item.antes), jsonLegible(item.despues)]
          .filter(Boolean).join(" ").toLowerCase();
        return bolsa.includes(texto);
      });

      listaHistorial.innerHTML = "";
      if(!filtrados.length){
        const vacio = document.createElement("div");
        vacio.className = "historial-vacio";
        vacio.textContent = historialCambios.length ? "No hay resultados para esos filtros." : "Todavía no hay registros en el historial.";
        listaHistorial.appendChild(vacio);
        return;
      }

      filtrados.forEach(item => {
        const articulo = document.createElement("article");
        articulo.className = "historial-item";

        const fecha = document.createElement("div");
        fecha.className = "historial-fecha";
        const partes = formatearFechaHoraHistorial(item.created_at);
        fecha.innerHTML = `<strong>${partes.fecha}</strong>${partes.hora}`;

        const contenido = document.createElement("div");
        contenido.className = "historial-contenido";
        const titulo = document.createElement("h3");
        titulo.textContent = etiquetaEntidad(item.entidad);
        const resumen = document.createElement("p");
        resumen.textContent = item.resumen || "Cambio registrado";
        const usuario = document.createElement("div");
        usuario.className = "historial-usuario";
        usuario.textContent = item.usuario_email || "Usuario sin correo";
        contenido.append(titulo, resumen, usuario);

        const badge = document.createElement("span");
        badge.className = `historial-badge ${item.accion || ""}`;
        badge.textContent = etiquetaAccion(item.accion);

        articulo.append(fecha, contenido, badge);

        if(item.antes !== null || item.despues !== null){
          const detalle = document.createElement("div");
          detalle.className = "historial-detalle";
          if(item.antes !== null){
            const antes = document.createElement("details");
            const sum = document.createElement("summary");
            sum.textContent = "Ver estado anterior";
            const pre = document.createElement("pre");
            pre.textContent = jsonLegible(item.antes);
            antes.append(sum, pre);
            detalle.appendChild(antes);
          }
          if(item.despues !== null){
            const despues = document.createElement("details");
            const sum = document.createElement("summary");
            sum.textContent = "Ver estado posterior";
            const pre = document.createElement("pre");
            pre.textContent = jsonLegible(item.despues);
            despues.append(sum, pre);
            detalle.appendChild(despues);
          }
          articulo.appendChild(detalle);
        }
        listaHistorial.appendChild(articulo);
      });
    }


    // ---------- Cambios puntuales ----------
    function formatearFecha(fechaISO){
      if(!fechaISO) return "";
      const [anio, mes, dia] = fechaISO.split("-").map(Number);
      return new Intl.DateTimeFormat("es-CL", {
        weekday:"long",
        day:"2-digit",
        month:"2-digit",
        year:"numeric"
      }).format(new Date(anio, mes - 1, dia));
    }

    function poblarHorarios(){
      cambioHoraOriginal.innerHTML = "";
      cambioHoraNueva.innerHTML = "";

      horasBase.forEach(hora => {
        const opcionOriginal = document.createElement("option");
        opcionOriginal.value = hora;
        opcionOriginal.textContent = hora;
        cambioHoraOriginal.appendChild(opcionOriginal);

        const opcionNueva = document.createElement("option");
        opcionNueva.value = hora;
        opcionNueva.textContent = hora;
        cambioHoraNueva.appendChild(opcionNueva);
      });
    }

    function poblarActividades(){
      const actividades = new Set();

      Object.values(horarios).forEach(semana => {
        Object.values(semana).forEach(filas => {
          filas.forEach(fila => {
            edificios.forEach(ed => {
              String(fila[ed] || "")
                .split("\n")
                .map(v => v.trim())
                .filter(Boolean)
                .forEach(v => actividades.add(v));
            });
          });
        });
      });

      actividadesSugeridas.innerHTML = "";
      [...actividades].sort((a,b) => a.localeCompare(b, "es")).forEach(nombre => {
        const option = document.createElement("option");
        option.value = nombre;
        actividadesSugeridas.appendChild(option);
      });
    }

    function actualizarCamposPorTipo(){
      const tipo = cambioTipo.value;
      const esExtra = tipo === "extra";
      const esSuspendido = tipo === "suspendido";

      cambioHoraOriginal.disabled = esExtra;
      cambioHoraOriginal.required = !esExtra;
      grupoHoraNueva.classList.toggle("oculto", esSuspendido);
      cambioHoraNueva.required = !esSuspendido;

      if(esExtra){
        cambioHoraOriginal.value = horasBase[0];
      }
      if(esSuspendido){
        cambioHoraNueva.value = horasBase[0];
      }
    }

    function abrirModalCambio(cambio = null){
      formCambio.reset();
      poblarHorarios();
      poblarActividades();

      if(cambio){
        tituloModalCambio.textContent = "Editar cambio puntual";
        cambioId.value = cambio.id;
        cambioFecha.value = cambio.fecha || "";
        cambioTipo.value = cambio.tipo || "cambio";
        cambioSemana.value = String(cambio.semana || 1);
        cambioDia.value = cambio.dia || "Lunes";
        cambioEdificio.value = cambio.edificio || "A";
        cambioActividad.value = cambio.actividad || "";
        cambioHoraOriginal.value = cambio.hora_original || horasBase[0];
        cambioHoraNueva.value = cambio.hora_nueva || horasBase[0];
        cambioMotivo.value = cambio.motivo || "";
      }else{
        tituloModalCambio.textContent = "Agregar cambio puntual";
        cambioId.value = "";
        cambioSemana.value = semanaActual;
        cambioDia.value = diaActual;
        cambioFecha.value = new Date().toISOString().slice(0,10);
      }

      actualizarCamposPorTipo();
      modalCambio.classList.remove("oculto");
      cambioFecha.focus();
    }

    function cerrarModalCambio(){
      modalCambio.classList.add("oculto");
      formCambio.reset();
      cambioId.value = "";
    }

    async function cargarCambiosPuntuales(){
      listaCambios.innerHTML = '<div class="cambios-vacio">Cargando cambios puntuales…</div>';

      const { data, error } = await db
        .from("cambios_horario_prueba")
        .select("*")
        .order("fecha", { ascending:true })
        .order("created_at", { ascending:true });

      if(error){
        console.error("Error cargando cambios puntuales:", error);
        listaCambios.innerHTML = '<div class="cambios-vacio">No se pudieron cargar los cambios puntuales.</div>';
        return;
      }

      cambiosPuntuales = data || [];
      renderCambiosPuntuales();
      renderTabla();
      renderMovil();
    }

    function renderCambiosPuntuales(){
      listaCambios.innerHTML = "";

      if(!cambiosPuntuales.length){
        const vacio = document.createElement("div");
        vacio.className = "cambios-vacio";
        vacio.textContent = "Todavía no hay cambios puntuales. El horario base se mantiene tal como está.";
        listaCambios.appendChild(vacio);
        return;
      }

      cambiosPuntuales.forEach(cambio => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "cambio-tarjeta";
        tarjeta.dataset.cambioId = String(cambio.id);

        const bloqueFecha = document.createElement("div");
        bloqueFecha.className = "cambio-fecha";
        bloqueFecha.textContent = formatearFecha(cambio.fecha);
        const semana = document.createElement("small");
        semana.textContent = `Semana ${cambio.semana} · ${cambio.dia}`;
        bloqueFecha.appendChild(semana);

        const info = document.createElement("div");
        info.className = "cambio-info";
        const actividad = document.createElement("strong");
        actividad.textContent = cambio.actividad || "Sin actividad";
        const ubicacion = document.createElement("small");
        ubicacion.textContent = `Edificio ${cambio.edificio}`;
        info.append(actividad, ubicacion);

        const horario = document.createElement("div");
        horario.className = "cambio-horario";

        if(cambio.tipo === "suspendido"){
          horario.classList.add("suspendido");
          horario.textContent = "Suspendido";
        }else if(cambio.tipo === "extra"){
          horario.classList.add("extra");
          horario.textContent = `Actividad extra · ${cambio.hora_nueva || ""}`;
        }else{
          horario.textContent = `${cambio.hora_original || ""} → ${cambio.hora_nueva || ""}`;
        }

        if(cambio.motivo){
          const motivo = document.createElement("small");
          motivo.textContent = cambio.motivo;
          horario.appendChild(motivo);
        }

        const acciones = document.createElement("div");
        acciones.className = "cambio-acciones";

        const btnEditar = document.createElement("button");
        btnEditar.type = "button";
        btnEditar.className = "btn-icono";
        btnEditar.textContent = "Editar";
        btnEditar.addEventListener("click", () => abrirModalCambio(cambio));

        const btnEliminar = document.createElement("button");
        btnEliminar.type = "button";
        btnEliminar.className = "btn-icono eliminar";
        btnEliminar.textContent = "Eliminar";
        btnEliminar.addEventListener("click", () => eliminarCambio(cambio));

        acciones.append(btnEditar, btnEliminar);
        tarjeta.append(bloqueFecha, info, horario, acciones);
        listaCambios.appendChild(tarjeta);
      });
    }

    async function guardarCambioPuntual(e){
      e.preventDefault();

      const tipo = cambioTipo.value;
      const registro = {
        fecha: cambioFecha.value,
        semana: Number(cambioSemana.value),
        dia: cambioDia.value,
        edificio: cambioEdificio.value,
        actividad: cambioActividad.value.trim(),
        hora_original: tipo === "extra" ? null : cambioHoraOriginal.value,
        hora_nueva: tipo === "suspendido" ? null : cambioHoraNueva.value,
        tipo,
        motivo: cambioMotivo.value.trim() || null
      };

      if(!registro.fecha || !registro.actividad){
        mostrarToast("Completa la fecha y la actividad");
        return;
      }

      const btn = document.getElementById("btnGuardarCambio");
      btn.disabled = true;
      btn.textContent = "Guardando…";

      const idEditado = cambioId.value ? Number(cambioId.value) : null;
      const registroAnterior = idEditado
        ? cambiosPuntuales.find(cambio => Number(cambio.id) === idEditado) || null
        : null;

      let resultado;

      if(idEditado){
        resultado = await db
          .from("cambios_horario_prueba")
          .update(registro)
          .eq("id", idEditado)
          .select("*")
          .single();
      }else{
        resultado = await db
          .from("cambios_horario_prueba")
          .insert(registro)
          .select("*")
          .single();
      }

      btn.disabled = false;
      btn.textContent = "Guardar cambio";

      if(resultado.error){
        console.error("Error guardando cambio puntual:", resultado.error);
        mostrarToast("No se pudo guardar el cambio");
        return;
      }

      const registroGuardado = resultado.data;

      await registrarHistorial({
        accion: idEditado ? "editar" : "crear",
        entidad: "cambio_puntual",
        registroId: registroGuardado?.id || idEditado,
        resumen: idEditado
          ? `Editó cambio puntual: ${registro.actividad} · Semana ${registro.semana}, ${registro.dia}, edificio ${registro.edificio}`
          : `Creó cambio puntual: ${registro.actividad} · Semana ${registro.semana}, ${registro.dia}, edificio ${registro.edificio}`,
        antes: registroAnterior,
        despues: registroGuardado || registro
      });

      cerrarModalCambio();
      await cargarCambiosPuntuales();
      mostrarToast(idEditado ? "Cambio actualizado" : "Cambio guardado");
    }

    async function eliminarCambio(cambio){
      const confirmar = confirm(
        `¿Eliminar el cambio de "${cambio.actividad}" del ${cambio.fecha}?`
      );
      if(!confirmar) return;

      const { error } = await db
        .from("cambios_horario_prueba")
        .delete()
        .eq("id", cambio.id);

      if(error){
        console.error("Error eliminando cambio puntual:", error);
        mostrarToast("No se pudo eliminar el cambio");
        return;
      }

      await registrarHistorial({
        accion: "eliminar",
        entidad: "cambio_puntual",
        registroId: cambio.id,
        resumen: `Eliminó cambio puntual: ${cambio.actividad} · Semana ${cambio.semana}, ${cambio.dia}, edificio ${cambio.edificio}`,
        antes: cambio,
        despues: null
      });

      await cargarCambiosPuntuales();
      mostrarToast("Cambio eliminado");
    }



    function mostrarLogin(){
      pantallaCarga.classList.add("oculto");
      aplicacion.classList.add("oculto");
      pantallaLogin.classList.remove("oculto");
      usuarioActivo.textContent = "";
      appInicializada = false;
      registroHorarioId = null;
    }

    async function mostrarAplicacion(user){
      pantallaCarga.classList.add("oculto");
      pantallaLogin.classList.add("oculto");
      aplicacion.classList.remove("oculto");
      usuarioActivo.textContent = user?.email || "Sesión iniciada";

      if(!appInicializada){
        appInicializada = true;
        await cargarDesdeStorage();
        await cargarCambiosPuntuales();
        await cargarHistorial();
      }
    }

    function mensajeLogin(error){
      const mensaje = (error?.message || "").toLowerCase();
      if(mensaje.includes("invalid login credentials")){
        return "El correo o la contraseña no son correctos.";
      }
      if(mensaje.includes("email not confirmed")){
        return "Debes confirmar tu correo antes de ingresar.";
      }
      return error?.message || "No se pudo iniciar sesión.";
    }

    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorLogin.textContent = "";
      btnLogin.disabled = true;
      btnLogin.textContent = "Ingresando…";

      const { error } = await db.auth.signInWithPassword({
        email: emailLogin.value.trim(),
        password: passwordLogin.value
      });

      if(error){
        errorLogin.textContent = mensajeLogin(error);
        btnLogin.disabled = false;
        btnLogin.textContent = "Ingresar";
      }else{
        passwordLogin.value = "";
        btnLogin.disabled = false;
        btnLogin.textContent = "Ingresar";
      }
    });



    // ---------- Indicadores de cambios puntuales en la tabla ----------
    function obtenerCambiosCelda(semana, dia, edificio, hora){
      return cambiosPuntuales.filter(cambio => {
        const mismaSemana = Number(cambio.semana) === Number(semana);
        const mismoDia = cambio.dia === dia;
        const mismoEdificio = cambio.edificio === edificio;
        const horaCambio = cambio.tipo === "extra" ? cambio.hora_nueva : cambio.hora_original;
        return mismaSemana && mismoDia && mismoEdificio && horaCambio === hora;
      });
    }

    function descripcionCambio(cambio){
      if(cambio.tipo === "suspendido"){
        return `${cambio.actividad}: suspendido el ${formatearFecha(cambio.fecha)}`;
      }
      if(cambio.tipo === "extra"){
        return `${cambio.actividad}: actividad extra ${cambio.hora_nueva || ""} el ${formatearFecha(cambio.fecha)}`;
      }
      return `${cambio.actividad}: ${cambio.hora_original || ""} → ${cambio.hora_nueva || ""} el ${formatearFecha(cambio.fecha)}`;
    }

    function enfocarCambios(cambios){
      if(cambios.length === 1){
        abrirModalCambio(cambios[0]);
        return;
      }

      listaCambios.scrollIntoView({ behavior:"smooth", block:"start" });
      mostrarToast(`Esta celda tiene ${cambios.length} cambios puntuales`);

      document.querySelectorAll(".cambio-tarjeta.resaltado")
        .forEach(tarjeta => tarjeta.classList.remove("resaltado"));

      const ids = new Set(cambios.map(cambio => String(cambio.id)));
      document.querySelectorAll(".cambio-tarjeta[data-cambio-id]").forEach(tarjeta => {
        if(ids.has(tarjeta.dataset.cambioId)){
          tarjeta.classList.add("resaltado");
          setTimeout(() => tarjeta.classList.remove("resaltado"), 2600);
        }
      });
    }

    // ---------- Render ----------
    function renderDias(){
      diasContenedor.innerHTML = "";
      diasBase.forEach(dia => {
        const btn = document.createElement("button");
        btn.className = "dia-btn" + (dia === diaActual ? " activo" : "");
        btn.textContent = dia.toUpperCase();
        btn.addEventListener("click", () => {
          diaActual = dia;
          renderDias();
          renderTabla();
          renderMovil();
        });
        diasContenedor.appendChild(btn);
      });
    }

    function crearCeldaEditable(dia, indiceFila, edificio, valorInicial){
      const wrapper = document.createElement("div");
      wrapper.className = "celda-con-cambio";

      const div = document.createElement("div");
      div.className = "celda-editable";
      div.contentEditable = "true";
      div.spellcheck = false;
      div.textContent = valorInicial || "";
      let valorAntes = div.textContent;

      div.addEventListener("input", () => {
        horarios[semanaActual][dia][indiceFila][edificio] = div.textContent;
        programarGuardado();
      });

      div.addEventListener("keydown", (e) => {
        if(e.key === "Enter"){
          e.preventDefault();
          document.execCommand("insertLineBreak");
        }
        if(e.key === "Escape") div.blur();
      });

      div.addEventListener("blur", async () => {
        div.textContent = div.textContent.replace(/\n+$/,"" );
        const valorDespues = div.textContent;
        horarios[semanaActual][dia][indiceFila][edificio] = valorDespues;

        if(valorDespues !== valorAntes){
          const horaCelda = horarios[semanaActual][dia][indiceFila].hora;

          await registrarHistorial({
            accion: "editar",
            entidad: "horario_base",
            registroId: registroHorarioId,
            resumen: `Editó horario base · Semana ${semanaActual}, ${dia}, edificio ${edificio}, ${horaCelda}`,
            antes: {
              semana: Number(semanaActual),
              dia,
              edificio,
              hora: horaCelda,
              actividad: valorAntes
            },
            despues: {
              semana: Number(semanaActual),
              dia,
              edificio,
              hora: horaCelda,
              actividad: valorDespues
            }
          });

          valorAntes = valorDespues;
        }
      });

      wrapper.appendChild(div);

      const hora = horarios[semanaActual][dia][indiceFila].hora;
      const cambios = obtenerCambiosCelda(semanaActual, dia, edificio, hora);

      if(cambios.length){
        const badge = document.createElement("button");
        badge.type = "button";
        badge.className = "badge-cambio";
        badge.textContent = String(cambios.length);
        badge.setAttribute("aria-label", `${cambios.length} cambio${cambios.length === 1 ? "" : "s"} puntual${cambios.length === 1 ? "" : "es"}`);
        badge.title = cambios.map(descripcionCambio).join("\n");

        if(cambios.every(cambio => cambio.tipo === "suspendido")){
          badge.classList.add("suspendido");
        }else if(cambios.every(cambio => cambio.tipo === "extra")){
          badge.classList.add("extra");
        }

        badge.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          enfocarCambios(cambios);
        });

        wrapper.appendChild(badge);
      }

      return wrapper;
    }

    function renderTabla(){
      cuerpoTabla.innerHTML = "";
      const filas = horarios[semanaActual][diaActual];

      filas.forEach((fila, indiceFila) => {
        const tr = document.createElement("tr");

        const tdHora = document.createElement("td");
        tdHora.className = "hora-celda";
        tdHora.textContent = fila.hora;
        tr.appendChild(tdHora);

        edificios.forEach(ed => {
          const td = document.createElement("td");
          td.appendChild(crearCeldaEditable(diaActual, indiceFila, ed, fila[ed]));
          tr.appendChild(td);
        });

        cuerpoTabla.appendChild(tr);
      });

      tituloTabla.textContent = `Semana ${semanaActual} · ${diaActual}`;
      estadoSemana.textContent = `SEMANA ${semanaActual}`;
    }

    function renderMovil(){
      horarioMovil.innerHTML = "";
      const filas = horarios[semanaActual][diaActual];

      filas.forEach((fila, indiceFila) => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "bloque-horario";

        const h3 = document.createElement("h3");
        h3.textContent = fila.hora;
        tarjeta.appendChild(h3);

        edificios.forEach(ed => {
          const grupo = document.createElement("div");
          grupo.className = "grupo-movil";

          const etiqueta = document.createElement("span");
          etiqueta.textContent = `EDIFICIO ${ed}`;
          grupo.appendChild(etiqueta);
          grupo.appendChild(crearCeldaEditable(diaActual, indiceFila, ed, fila[ed]));

          tarjeta.appendChild(grupo);
        });

        horarioMovil.appendChild(tarjeta);
      });
    }

    function renderTodo(){
      renderDias();
      renderTabla();
      renderMovil();
    }

    // ---------- Eventos ----------
    botonesSemana.forEach(btn => {
      btn.addEventListener("click", () => {
        semanaActual = btn.dataset.semana;
        botonesSemana.forEach(b => b.classList.toggle("activa", b === btn));
        diaActual = "Lunes";
        renderTodo();
      });
    });

    document.getElementById("btnExportar").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(horarios, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "horario-pausas-activas.json";
      a.click();
      URL.revokeObjectURL(url);
      mostrarToast("Copia exportada");
    });

    document.getElementById("btnRestablecer").addEventListener("click", async () => {
      if(confirm("¿Restablecer el horario a la versión original? Se perderán los cambios que hayas hecho.")){
        const horarioAnterior = JSON.parse(JSON.stringify(horarios));
        horarios = JSON.parse(JSON.stringify(datosOriginales));
        renderTodo();
        await guardarEnStorage();

        await registrarHistorial({
          accion: "restablecer",
          entidad: "horario_base",
          registroId: registroHorarioId,
          resumen: "Restableció todo el horario base a su versión original",
          antes: horarioAnterior,
          despues: horarios
        });

        mostrarToast("Horario restablecido");
      }
    });

    document.getElementById("btnCerrarSesion").addEventListener("click", async () => {
      if(guardarPendiente){
        clearTimeout(guardarPendiente);
        guardarPendiente = null;
        await guardarEnStorage();
      }
      await db.auth.signOut();
    });


    document.getElementById("btnNuevoCambio").addEventListener("click", () => abrirModalCambio());
    document.getElementById("btnCerrarModal").addEventListener("click", cerrarModalCambio);
    document.getElementById("btnCancelarCambio").addEventListener("click", cerrarModalCambio);
    cambioTipo.addEventListener("change", actualizarCamposPorTipo);
    formCambio.addEventListener("submit", guardarCambioPuntual);

    btnActualizarHistorial?.addEventListener("click", () => cargarHistorial());
    buscarHistorial?.addEventListener("input", renderHistorial);
    filtroAccionHistorial?.addEventListener("change", renderHistorial);
    filtroEntidadHistorial?.addEventListener("change", renderHistorial);
    btnCargarMasHistorial?.addEventListener("click", async () => {
      limiteHistorial += 30;
      await cargarHistorial(true);
    });

    modalCambio.addEventListener("click", (e) => {
      if(e.target === modalCambio) cerrarModalCambio();
    });

    document.addEventListener("keydown", (e) => {
      if(e.key === "Escape" && !modalCambio.classList.contains("oculto")){
        cerrarModalCambio();
      }
    });


    async function iniciar(){
      const { data:{ session } } = await db.auth.getSession();

      if(session?.user){
        await mostrarAplicacion(session.user);
      }else{
        mostrarLogin();
      }

      db.auth.onAuthStateChange((_evento, sessionActual) => {
        if(sessionActual?.user){
          mostrarAplicacion(sessionActual.user);
        }else{
          mostrarLogin();
        }
      });
    }

    iniciar();