var tabla;
$(function () {

    /*definicion de la estructura de datatable*/
    tabla = $('#tabla').DataTable({
        responsive: true,
        ordering: false,
        ajax: {
            url: '/Home/ListarClientes',
            type: 'GET',
            dataType: 'json',
            dataSrc: 'data'
        },
        columns: [
            { data: 'id' },
            { data: 'cuit'},
            {
                data: 'cuit',
                render: async function (data) {
                    const razonSocial = await obtenerRazonSocialPorCuit(data);
                    return razonSocial;
                }           
            },
            { data: 'telefono' },
            { data: 'direccion' },
            {
              data: 'activo',
                render: function (data) {
                    return data === true ? "Si" : "No";
                } },
            {
                defaultContent: '<div class="d-flex">' +
                    '<button type="button" class="btn btn-primary btn-sm btn-editar me-2"><i class="bi bi-pencil-square"></i></button>' +
                    '<button type="button" class="btn btn-danger btn-sm btn-eliminar"><i class="bi bi-trash"></i></button>' +
                    '</div>',
                orderable: false,
                searchable: false,
                width: "60px"
            }
        ],
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        }
    });
   
});

/*funcion abrir modal*/
function abrirModal(json) {

    $("#txtid").val(0);
    $("#txtcuit").val("");
    $("#txttelefono").val("");
    $("#txtdireccion").val("");

    if (json !== null) {

        $("#txtid").val(json.id);
        $("#txtcuit").val(json.cuit);
        $("#txttelefono").val(json.telefono);
        $("#txtdireccion").val(json.direccion);

    }

    $("#FormModal").modal("show");
}

/*evento para el boton de editar*/
$("#tabla tbody").on("click", ".btn-editar", function () {

    let filaSeleccionada = $(this).closest("tr");
    let data = tabla.row(filaSeleccionada).data();
    abrirModal(data);

});

/*Evento de clic para el botón de eliminar*/
$("#tabla tbody").on("click", ".btn-eliminar", function () {

    let filaSeleccionada = $(this).closest("tr");
    let data = tabla.row(filaSeleccionada).data();
    let idCliente = data.id;

    if (confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
        $.post("/Home/EliminarCliente", { id: idCliente })
            .done(function (response) {

                mostrarToast("El cliente se elimino exitosamente", "success");
                tabla.row(filaSeleccionada).remove().draw();

            })
            .fail(function (error) {

                mostrarToast("Ocurrio un error al eliminar el cliente", "error");

            });
    }
});

/*evento para el boton guardar del modal*/
$("#btnGuardarCambios").on("click", function () {

    let cuit = $("#txtcuit").val();
    let telefono = $("#txttelefono").val();
    let direccion = $("#txtdireccion").val();

    if (!cuit || !telefono || !direccion) {  
        
        mostrarToast("Todos los campos obligatorios deben tener un valor", "error");
        return;

    }

    if (cuit.length !== 11 ) {

    mostrarToast("El cuit debe tener 11 valores", "error");
    return;

    }

    let formData = new FormData($("#usuarioForm")[0]);

    if ($("#txtid").val() == 0) {
        $.ajax({
            url: "/Home/CrearCliente",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                tabla.ajax.reload();
                mostrarToast("El cliente se creo exitosamente", "success");
                $("#FormModal").modal("hide");
            },
            error: function (error) {
                console.error(error);
                mostrarToast("Error al crear un cliente", "error");
            }
        });
    } else {
        formData.append("id", $("#txtid").val());
        $.ajax({
            url: "/Home/ModificarCliente",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                tabla.ajax.reload();
                mostrarToast("El cliente se modifico exitosamente", "success");
                $("#FormModal").modal("hide");
            },
            error: function (error) {
                console.error(error);
                mostrarToast("Error al modificar el cliente", "error");
            }
        });
    }
});


/*funcion para evitar el comportamieto por defecto del boton guardar*/
$("#usuarioForm").on("submit", function (event) {
    event.preventDefault();
});

/*resetear los campos del modal al cerrar*/
$("#FormModal").on("hidden.bs.modal", function () {
    $("#usuarioForm")[0].reset();
});

/*evento para cambiar estado del cliente*/
    $("#tabla tbody").on("click", "td:nth-child(6)", function () {
        let celdaSeleccionada = $(this);
        let filaSeleccionada = $(this).closest("tr");
        let data = tabla.row(filaSeleccionada).data();
        let idCliente = data.id;
        let estadoActual = data.activo;

        var nuevoEstado = !estadoActual;


        $.post("/Home/CambiarEstadoCliente", { id: idCliente, nuevoEstado: nuevoEstado })
            .done(function (response) {
                mostrarToast("Estado del cliente cambiado exitosamente.", "success");
                data.activo = nuevoEstado;
                tabla.row(filaSeleccionada).data(data).draw();
            })
            .fail(function (error) {
                mostrarToast("Ocurrido un error al cambiar el estado del cliente", "error");
                console.error(error);
            });
    });

// Mostrar mensaje toast
function mostrarToast(message, type) {
    let toastContainer = $("#toastContainer");
    let toastClass = "";

    switch (type) {
        case "success":
            toastClass = "bg-success text-white";
            break;
        case "error":
            toastClass = "bg-danger text-white";
            break;
    }

    let toast = `
                    <div class="toast show ${toastClass}" role="alert" aria-live="assertive" aria-atomic="true">
                        <div class="toast-body">
                            ${message}
                            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                        </div>
                    </div>
                `;

    toastContainer.append(toast);

    $(".toast").toast("show");
    $(".toast").on("hidden.bs.toast", function () {
        $(this).remove();
    });
}

/*funcion para traer las razones sociales*/
function obtenerRazonSocialPorCuit(cuit) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: 'https://sistemaintegracomex.com.ar/Account/GetNombreByCuit?cuit=' + cuit,
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                if (response && response.length > 0) {
                    resolve(response);
                } else {
                    resolve("No Existe");
                }
            },
            error: function () {
                console.error("Error al intentar obtener la razon social");
                reject("Error al intentar obtener la razon social");
            }
        });
    });
}
