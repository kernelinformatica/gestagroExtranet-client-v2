
import { DetalleCtaCte } from '../../models/detallectacte';
import { Resumen } from './../../models/resumen';
import { Component, ElementRef, Inject, OnInit, PLATFORM_ID, RendererFactory2, ViewChild } from '@angular/core';
import { GlobalService } from '../../services/global.service';
import { ExportService } from '../../services/export.service';
import { StyleService } from '../../services/sytle.service';
import { CuentaCorrienteService } from '../../services/cuenta-corriente.service';
import { Usuario } from '../../models/usuario';
import { Empresa } from '../../models/empresa';
import { Cuenta } from '../../models/cuenta';
import { Configuraciones } from '../../../enviroments/configuraciones';
import { Funciones } from '../../models/funciones';
import { ActivatedRoute, Router } from '@angular/router';
import { TopbarComponent } from "../../components/topbar/topbar.component";
import { SidebarComponent } from "../../components/sidebar/sidebar.component";
import { TextosApp } from '../../../enviroments/textos-app';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders, provideHttpClient, withFetch } from '@angular/common/http';
import { AfterViewInit } from '@angular/core';
import { SpinerComponent } from '../../components/spiner/spiner.component';
import { environment } from '../../../enviroments/enviroment.prod';
import { ReportesService } from '../../services/reportes.service';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { Modal } from 'bootstrap';
import { UiService } from '../../services/ui.service';
import { DescargaService } from '../../services/descarga.service';

@Component({
  selector: 'app-cuenta-corriente',
  imports: [CommonModule, TopbarComponent, SidebarComponent, SpinerComponent],
  templateUrl: './cuenta-corriente.component.html',
  styleUrl: './cuenta-corriente.component.css',
  standalone: true
})
export class CuentaCorrienteComponent implements OnInit, AfterViewInit {


  public usuarioLogueado!: Usuario;
  public empresa: Empresa[] = []
  public usuarioConectado: Usuario[] = [];
  public usuarioCuenta: Cuenta[] = [];
  public usuarioFunciones: Funciones[] =[]
  public AppNombre = Configuraciones.appNombre;
  public detalleCtaCte: any;  // Usado para almacenar respuesta del servicio
  public cantidadMovimientos: number = 0;
  public verModarDescargaPdf: boolean = false;
  public copyRigth: string = Configuraciones.kernelCopyRigth;
  permisos: string[] = []
  public fechaHoy :Date;
  fechasIguales: boolean;
  permisoDescargaComp:string | "N" | undefined;
  tieneCtacteDolar:string | "N" | undefined;
  fechaInfoActualizacion:string | "" | undefined;
  fechaSaldoActualizacion: string | "" | undefined;
  loading = true;
  bgColorSideBar = "";
  msgSobreDisponiblidadPDFCtacte = TextosApp.mensajeSobreDisponiblidadPDFCtacte
  msgFechaActualizacion = TextosApp.mensajeFechaActualizacion
  resumen: any[] = [];
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    rendererFactory: RendererFactory2,
    private globalService: GlobalService,
    private ctacteService: CuentaCorrienteService,
    private styleService: StyleService,
    private reportesService: ReportesService,
    private exportService: ExportService,
    private utilsService: UiService,
    private descargaService: DescargaService,
    @Inject(PLATFORM_ID) private platformId: Object

  ) {

  }
  ngAfterViewInit() {
    // Inicializar el modal después de que la vista se haya inicializado

  }
  getStyleTemplate(elemento:string, propiedad:string) {

    return this.styleService.getStyleTemplate(elemento, propiedad);

  }
   async cargarResumen(): Promise<any> {
    this.loading = true;
      setTimeout(() => {
        //this.loading = false;
        //this.errorMessage = ""
      }, 5000);
      try {
        this.ctacteService.getCuentaCorrientePesos(this.usuarioLogueado.cuenta.id).subscribe((response: any) => {


          this.detalleCtaCte = response.datos.movimiento.map((item: any) => ({
            ...item,
            pdfExiste: false, // Agregar pdfExiste como false por defecto
          }));
          this.detalleCtaCte.forEach(item => {
            this.verificarExistenciaPDF(item);
          });
          this.cantidadMovimientos = response.datos.movimiento.length
          const datetempSaldo = new Date(this.usuarioCuenta[0].ultActualizacion);
          const dateTemp = new Date(this.detalleCtaCte[0].control)
          this.fechaInfoActualizacion = this.utilsService.fechasFormatos(datetempSaldo, 0,1)
          this.fechaSaldoActualizacion = this.utilsService.fechasFormatos(datetempSaldo, 3, 1)

          this.loading = false;

        });



        // Handle successful login (e.g., navigate to another page)
      } catch (error: any) {

        this.loading = false;

        console.error('Login Error', error);
        //this.errorMessage = String(error);
      }




  }
  permisoTipoComprobante2(item: any) {
    return item.pdfExiste; // Mostrar ícono solo si el PDF existe
  }

  verificarExistenciaPDF(item: any) {

    if (this.globalService.getPermisoTipoComprobantesPermitidos(item)){
      const url = this.descargaService.getURLDescargaComprobante(item, "P");
     this.descargaService.verificarArchivo(url).subscribe(
      () => {
        item.pdfExiste = true; // Si existe
      },
      () => {
        item.pdfExiste = false; // Si no existe
      }
    );
  }else{
    item.pdfExiste = false;
    }

  }

  permisoTipoComprobante(item){
    return this.globalService.getPermisoTipoComprobantesPermitidos(item);
  }





  descargaComprobante(item) {
    // Armo el nombre del archivo


      const url = this.descargaService.getURLDescargaComprobante(item, "P");

      const cuenta = this.globalService.getUsuarioLogueado().cuenta.id;
      const [dia, mes, anio] = item.ingreso.split('/');
      const nc = item.numero.toString();
      const puntoVenta = nc.slice(0, 2); // Extrae los primeros 2 dígitos como punto de venta
      const restoNumero = nc.slice(2); // Extrae el resto del número
      const puntoVentaFormateado = puntoVenta.padStart(3, '0'); // Asegura que el punto de venta tenga 4 dígitos
      const numeroComprobante = puntoVentaFormateado + "-" + restoNumero;
      const fileName = `${anio + mes + dia + "-" + numeroComprobante + "-" + cuenta}.pdf`;

      // Crea un enlace
      const a = document.createElement('a');
      a.href = url
      a.download = fileName; // Nombre del archivo
      a.target = '_blank'; // Abre el enlace en una nueva pestaña
      document.body.appendChild(a); // Añade el enlace al DOM
      a.click(); // Hace clic en el enlace
      document.body.removeChild(a); // Elimina el enlace del DOM

  }



  ngOnInit(): void {
    if (this.globalService.getPermisoCtaCte()) {

    this.bgColorSideBar = this.styleService.getStyleTemplate('navbar-nav', 'background-color')
    if (typeof document !== 'undefined') {
      // Código que usa el objeto document
      this.enableDismissTrigger();
    }
    if (this.globalService.getUsuarioLogueado() === null) {
      this.usuarioCuenta = []
      this.globalService.logout();
      this.router.navigate(['/login']); // Adjust the path to your login page
    }else{
      this.usuarioLogueado = this.globalService.getUsuarioLogueado()
      if (this.usuarioLogueado) {

        this.permisoDescargaComp = this.globalService.getPermisoDescargaComprobantes();
        this.usuarioCuenta = [
          {
            id : this.usuarioLogueado["id"],
            nombre:this.usuarioLogueado["nombre_apellido"],
            email: this.usuarioLogueado["email"],
            tipoUsuario :this.usuarioLogueado["grupos"]["grupo"]["id_grupo"],
            tipoUsuarioNombre : this.usuarioLogueado["grupos"]["grupo"]["descripcion"],
            fecha:  new Date(),
            claveMarcaCambio : this.usuarioLogueado["marca_cambio"],
            ultActualizacion : "",

          }
        ];

        this.fechaHoy = new Date();
        // Convertir la fecha en formato string a un objeto Date
        //
        const fechaComparar = new Date(this.usuarioCuenta[0].fecha+ 'T00:00:00');
        this.fechasIguales = this.fechaHoy.toDateString() === fechaComparar.toDateString();
        this.cargarResumen()
      } else {
        this.globalService.logout();
         this.router.navigate(['/login']);
        // Handle the null case, e.g., redirect to login
      }
    }



  }else{
    this.logout()
    }

  }




  logout(){
    this.router.navigate(['/logout']);


  }




  descargarXlsCtaCte =(data) => {
    this.exportService.exportToExcel('data.xls', data);
  }


  descargarCsvCtaCte =(data) => {
    this.exportService.exportToCsv('data.csv', data);
  }

  descargarReporteCtaCte = () => {


    this.reportesService.validarServicioReportePdf().subscribe(response => {
        const url = Configuraciones.dominioBaseDescargaPdf+`/resumen-ctacte-${this.globalService.getUsuarioLogueado().cuenta.id}.pdf`
        this.reportesService.descargarCtaCtePdf().subscribe((resp: any) => {});

        this.verModarDescargaPdf = true;
          setTimeout(() => {
            this.verModarDescargaPdf = false;

            const a = document.createElement('a');
            a.href = url;
            a.download = `resumen-ctacte-${this.globalService.getUsuarioLogueado().cuenta.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

          }, 2000); // 5000 milisegundos = 5 segundos de espera antes de ejecutar la descarga




      })
      error => {
        // Maneja el error en la solicitud HTTP

        let msg = "Error: El servicio de reportes pdf no esta disponible por el momento, intente nuevamente más tarde";
        alert(msg)
        console.error(msg);




    }

  }



  enableDismissTrigger(): void {
    // Implementación de enableDismissTrigger
  }

}
