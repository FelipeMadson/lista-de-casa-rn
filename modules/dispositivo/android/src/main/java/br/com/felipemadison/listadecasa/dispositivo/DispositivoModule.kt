package br.com.felipemadison.listadecasa.dispositivo

import android.content.Context
import android.os.BatteryManager
import android.os.Build
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Módulo nativo (Aula 19): expõe ao JavaScript dados que só o Android
 * conhece. Equivale ao MethodChannel "compras/dispositivo" da versão Flutter.
 */
class DispositivoModule : Module() {
  private val contexto: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    // Mesmo nome usado em src/dados/plataforma/dispositivoNativo.ts.
    Name("Dispositivo")

    AsyncFunction("obterInformacoes") {
      val bateria = contexto.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
      mapOf(
        "fabricante" to Build.MANUFACTURER,
        "modelo" to Build.MODEL,
        "versaoAndroid" to Build.VERSION.RELEASE,
        "bateria" to bateria.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY),
      )
    }
  }
}
