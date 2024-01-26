using System;
using System.Collections.Generic;

namespace pruebaTecnicaIntegracomex.Models.DB
{
    public partial class Cliente
    {
        public int Id { get; set; }
        public string? Cuit { get; set; }
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }
        public bool? Activo { get; set; }
    }
}
