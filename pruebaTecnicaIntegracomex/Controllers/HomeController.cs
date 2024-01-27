using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using pruebaTecnicaIntegracomex.Models;
using pruebaTecnicaIntegracomex.Models.DB;
using System.Diagnostics;

namespace pruebaTecnicaIntegracomex.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private Models.DB.integraComexContext _db;

        public HomeController(ILogger<HomeController> logger, Models.DB.integraComexContext db)
        {
            _logger = logger;
            _db = db;
        }

        public IActionResult Index()
        {
            return View();
        }


        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        public async Task<IActionResult> ListarClientes ()
        {
            try
            {

                var clientes = await _db.Clientes.FromSqlRaw("EXEC SP_LISTARCLIENTE").AsNoTracking().ToListAsync();

                var respuesta = clientes.Select(Cliente => new
                {

                    id = Cliente.Id,
                    cuit = Cliente.Cuit,
                    telefono = Cliente.Telefono,
                    direccion = Cliente.Direccion,
                    activo = Cliente.Activo

                }).ToList();

                return Json(new { data = respuesta });

            }
            catch (Exception ex)
            {

                return BadRequest(ex.Message);

            }
        }

        [HttpPost]
        public IActionResult CambiarEstadoCliente(int id, bool nuevoEstado)
        {

            try
            {

                var cliente = _db.Clientes.Find(id);
                if (cliente != null)
                {
                    cliente.Activo = nuevoEstado;
                    _db.SaveChanges();
                    return Json(new { success = true });
                }
                else
                {
                    return BadRequest("Error al intentar cambiar el estado del cliente");
                }

            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
            
        }

        [HttpPost]
        public async Task<IActionResult> CrearCliente(Cliente nuevoCliente)
        {
            try
            {
                if (ModelState.IsValid)
                {

                    var cuit = nuevoCliente.Cuit;
                    var telefono = nuevoCliente.Telefono;
                    var direccion = nuevoCliente.Direccion;

                    await _db.Database.ExecuteSqlRawAsync("EXEC SP_CREARCLIENTE @cuit, @telefono, @direccion",
                                            new SqlParameter("@cuit", cuit),
                                            new SqlParameter("@telefono", telefono),
                                            new SqlParameter("@direccion", direccion));

                    return Ok("El cliente se creo exitosamente");

                }
            }
            catch (Exception ex)
            {
                return BadRequest($"{ex.Message}");
            }

            return View("Index");
        }


        [HttpPost]
        public async Task<IActionResult> ModificarCliente(Cliente clienteModificado)
        {
            if (ModelState.IsValid)
            {
                try
                {
    
                    var id = clienteModificado.Id;
                    var nuevoCuit = clienteModificado.Cuit;
                    var nuevoTelefono = clienteModificado.Telefono;
                    var nuevaDireccion = clienteModificado.Direccion;

                    await _db.Database.ExecuteSqlRawAsync("EXEC SP_EDITARCLIENTE @id, @nuevoCuit, @nuevoTelefono, @nuevaDireccion",
                                            new SqlParameter("@id", id),
                                            new SqlParameter("@nuevoCuit", nuevoCuit),
                                            new SqlParameter("@nuevoTelefono", nuevoTelefono),
                                            new SqlParameter("@nuevaDireccion", nuevaDireccion));

                    return Ok("El cliente se modifico exitosamente");
                }
                catch (Exception ex)
                {
                    return BadRequest($"{ex.Message}");
                }
            }

            return View("Index");
        }


        [HttpPost]
        public async Task<IActionResult> EliminarCliente(int id)
        {
            try
            {
                var idParameter = new SqlParameter("@id", id);
                await _db.Database.ExecuteSqlRawAsync("EXEC SP_ELIMINARCLIENTE @id", idParameter);

                return Ok("El cliente se elimino exitosamente");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

    }
}
