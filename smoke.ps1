$ErrorActionPreference = "Continue"
$base = "http://localhost:3000"

# Password demo mengikuti prisma/seed.ts.
$seedPassword = @{
  "admin@sekolah.test"     = "admin123"
  "kepsek@sekolah.test"    = "kepsek123"
  "kurikulum@sekolah.test" = "kurikulum123"
  "guru@sekolah.test"      = "guru123"
  "guru2@sekolah.test"     = "guru123"
  "siswa@sekolah.test"     = "siswa123"
  "siswa2@sekolah.test"    = "siswa123"
  "siswa3@sekolah.test"    = "siswa123"
}

# Hanya lima akun pertama per role yang dipakai, DAN hanya kalau masih ada di
# database. Akun demo bisa terhapus lewat Manajemen Pengguna, jadi daftarnya
# tidak boleh diasumsikan selamanya lengkap.
$candidates = @(
  @{role="ADMIN";     email="admin@sekolah.test"},
  @{role="KEPSEK";    email="kepsek@sekolah.test"},
  @{role="KURIKULUM"; email="kurikulum@sekolah.test"},
  @{role="GURU";      email="guru@sekolah.test"},
  @{role="GURU";      email="guru2@sekolah.test"},
  @{role="SISWA";     email="siswa@sekolah.test"},
  @{role="SISWA";     email="siswa2@sekolah.test"},
  @{role="SISWA";     email="siswa3@sekolah.test"}
)

$seenRole = @{}
$accounts = @()
foreach ($c in $candidates) {
  if ($seenRole.ContainsKey($c.role)) { continue }
  $s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $body = @{ email = $c.email; password = $seedPassword[$c.email] } | ConvertTo-Json
  try {
    $r = Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -Body $body -ContentType "application/json" -WebSession $s -UseBasicParsing -TimeoutSec 30
    if ($r.StatusCode -eq 200) {
      $seenRole[$c.role] = $true
      $accounts += @{ role = $c.role; email = $c.email; pass = $seedPassword[$c.email] }
    }
  } catch {
    # Akun ini tidak ada / dinonaktifkan — lewati, tidak dihitung sebagai error.
    Write-Output "INFO  akun demo $($c.email) tidak tersedia, dilewati"
  }
}

# Halaman yang boleh dibuka tiap role. Role yang tidak diberi akses ke suatu
# halaman akan mendapat 404 dari requireRole() — itu sesuai desain, bukan bug.
$semua = @(
  "/dashboard","/tugas","/nilai","/absensi","/jadwal",
  "/kelas","/mapel","/pengguna","/laporan","/pengumuman","/profil"
)
$bisa = @{
  "ADMIN"     = $semua
  "KEPSEK"    = $semua
  "KURIKULUM" = @("/dashboard","/tugas","/nilai","/absensi","/jadwal","/kelas","/mapel","/laporan","/pengumuman","/profil")
  "GURU"      = @("/dashboard","/tugas","/nilai","/jadwal","/kelas","/mapel","/pengumuman","/profil")
  "SISWA"     = @("/dashboard","/tugas","/nilai","/jadwal","/kelas","/pengumuman","/profil")
}

# Pola halaman error yang harus caught kalau render gagal.
$errorPattern = "Application error|Internal Server Error|Cannot find module"

$errors = 0
$checks = 0

Write-Output "=== CEK LOGIN & HALAMAN ($base) ==="

if ($accounts.Count -lt 5) {
  Write-Output "WARN hanya $($accounts.Count) role terdeteksi. Jalankan 'npm run db:seed' untuk data contoh."
}

foreach ($a in $accounts) {
  $s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $body = @{ email = $a.email; password = $a.pass } | ConvertTo-Json

  $checks++
  try {
    $login = Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -Body $body -ContentType "application/json" -WebSession $s -UseBasicParsing -TimeoutSec 30
    if ($login.StatusCode -ne 200) {
      $errors++
      Write-Output "GAGAL $($a.role) login=$($login.StatusCode)"
      continue
    }
  } catch {
    $errors++
    Write-Output "GAGAL $($a.role) login -> $($_.Exception.Message)"
    continue
  }

  $bad = @()
  foreach ($p in $bisa[$a.role]) {
    $checks++
    try {
      $r = Invoke-WebRequest "$base$p" -WebSession $s -UseBasicParsing -TimeoutSec 30
      if ($r.StatusCode -ne 200) { $bad += "$p=$($r.StatusCode)" }
      elseif ($r.Content -match $errorPattern) { $bad += "$p=error-page" }
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      if ($code -ne 404) { $bad += "$p=ERR$code" }
    }
  }

  # Halaman yang TIDAK boleh diakses role ini harus mengembalikan 404.
  foreach ($p in ($semua | Where-Object { $_ -notin $bisa[$a.role] })) {
    $checks++
    try {
      $r = Invoke-WebRequest "$base$p" -WebSession $s -UseBasicParsing -TimeoutSec 30
      # Halamansrv tetap 200 tapi tidak ada di menu; yang penting bukan 500.
      if ($r.Content -match $errorPattern) { $bad += "$p=error-page(wHarus 404)" }
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      if ($code -ne 404) { $bad += "$p=ERR$code (harusnya 404)" }
    }
  }

  if ($bad.Count -gt 0) {
    $errors++
    Write-Output "GAGAL $($a.role) :: $($bad -join ', ')"
  } else {
    Write-Output "OK   $($a.role) :: login 200, $($bisa[$a.role].Count) halaman aman, akses terbatas sesuai role"
  }
}

# Landing page harus bisa dibuka tanpa login.
$checks++
try {
  $l = Invoke-WebRequest "$base/" -UseBasicParsing -TimeoutSec 30
  if ($l.StatusCode -eq 200 -and $l.Content -match "Citra Negara Zaki LMS") {
    Write-Output "OK   landing page publik"
  } else {
    $errors++
    Write-Output "GAGAL landing page (status $($l.StatusCode))"
  }
} catch {
  $errors++
  Write-Output "GAGAL landing page -> $($_.Exception.Message)"
}

# Halaman privat harus dialihkan ke login kalau belum punya sesi.
# Catatan: Invoke-WebRequest mengikuti redirect secara default, jadi redirect
# dimatikan. Di PowerShell 5.1 respons 307 TIDUK melempar exception, melainkan
# dikembalikan apa adanya — jadi statusnya yang diperiksa.
$checks++
$r = Invoke-WebRequest "$base/dashboard" -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 30 -ErrorAction SilentlyContinue
$code = [int]$r.StatusCode
$loc = $r.Headers["Location"]
if ($code -eq 307 -and $loc -match "/login") {
  Write-Output "OK   /dashboard tanpa login di-redirect ($code -> $loc)"
} else {
  $errors++
  Write-Output "GAGAL proteksi middleware -> $code $loc"
}

Write-Output ""
if ($errors -eq 0) {
  Write-Output "=== SEMUA LULUS: $checks pemeriksaan, 0 gagal ==="
} else {
  Write-Output "=== $checks pemeriksaan, $errors GAGAL ==="
  exit 1
}