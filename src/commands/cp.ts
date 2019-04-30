import {Command, flags} from '@oclif/command'
import {Config} from "../Config";
import {Client} from "../BunnyClient";
import * as fs from "fs";
import {downloadScanDir, IStatusStruct, uploadScanDir} from "../utils/fsutils";


export default class Cp extends Command {

  static description = 'This is the cp-like command for BunnyCDN storages.';

  static examples = [
    `
    Maximum async file operations is 8. You can change this value: https://dkfn.github.io/bunnycdn-cli/docs/set-workers
    
    One file upload
    
    $ bnycdn cp -s tetelincdn --from ./dist/deb/bnycdn_0.0.2-1_amd64.deb --to /tetelincdn/nightly/deb/test.deb
    ⌛[UP]                 /tetelincdn/nightly/deb/test.deb => 8.78 MB
    ✔[OK]                 /tetelincdn/nightly/deb/test.deb => 8.78 MB

    
    Recursive file upload
    
    $ bnycdn -s dkfn -R --from ./dist --to /dkfn/nightly                
     ⌛[UP] [ ∞ 0| ⇈ 1]    /dkfn/nightly/deb/Packages => 1.04 KB
     ⌛[UP] [ ∞ 0| ⇈ 2]    /dkfn/nightly/deb/Packages.bz2 => 656 B
     ⌛[UP] [ ∞ 0| ⇈ 3]    /dkfn/nightly/deb/Packages.gz => 597 B
     ⌛[UP] [ ∞ 0| ⇈ 4]    /dkfn/nightly/deb/Packages.xz => 656 B
     ✔[OK] [ ∞ 3| ⇈ 3]    /dkfn/nightly/deb/Packages.xz => 656 B
     ✔[OK] [ ∞ 3| ⇈ 2]    /dkfn/nightly/deb/Packages.gz => 597 B
     ⌛[UP] [ ∞ 2| ⇈ 3]    /dkfn/nightly/deb/bnycdn_0.0.2-1_amd64.deb => 8.78 MB
     ⌛[UP] [ ∞ 1| ⇈ 4]    /dkfn/nightly/deb/bnycdn_0.0.2-1_armel.deb => 7.65 MB
     ✔[OK] [ ∞ 1| ⇈ 3]    /dkfn/nightly/deb/Packages => 1.04 KB
     ✔[OK] [ ∞ 1| ⇈ 2]    /dkfn/nightly/deb/Packages.bz2 => 656 B
     ⌛[UP] [ ∞ 0| ⇈ 3]    /dkfn/nightly/deb/Release => 1.96 KB
     ✔[OK] [ ∞ 0| ⇈ 2]    /dkfn/nightly/deb/Release => 1.96 KB
     ✔[OK] [ ∞ 0| ⇈ 1]    /dkfn/nightly/deb/bnycdn_0.0.2-1_armel.deb => 7.65 MB
     ✔[OK]                /dkfn/nightly/deb/bnycdn_0.0.2-1_amd64.deb => 8.78 MB
     
    `,
  ];

  static flags = {
    help: flags.help({char: 'h'}),
    storage: flags.string({char: 's'}),
    from: flags.string({char: 'f'}),
    to: flags.string({char: 't'}),
    R: flags.boolean({char: 'R'}),
  };

  static filesPooled = 0;

  static status: IStatusStruct = {pending: 0, working: 0, errors: 0, ok: 0, lastUpdate: Date.now()};

  static args = [{name: "from", storage: "storage"}];

  async run() {
    Config.loadConfig();

    // TODO : Use argv instead of flags for from/to
    const {flags, argv} = this.parse(Cp);

    console.log(argv);

    if (!flags.storage) {
      this.error("You must specify a storage zone with -s");
      this.exit(127);
    }

    if (flags.to && flags.from) {
      if (fs.existsSync(flags.from)) {
          if (flags.R) {
            uploadScanDir(
              flags.from.endsWith("/") ? flags.from : flags.from + "/",
              flags.to.endsWith("/") ? flags.to : flags.to + "/",
              flags.storage!,
              Cp.status,
              Client.uploadFile
            );
          } else {
              Client.uploadFile(flags.storage, flags.from, flags.to!);
            }
      } else {
          if (flags.R) {
            downloadScanDir(flags.storage!, flags.from, flags.to, Cp.status, flags.from);
          } else {
            // TODO : Check if filename is written, if not, append to path inside function
            Cp.status.working = Cp.status.working + 1;
              Client.downloadFile(flags.storage, flags.from, flags.to);
          }
      }
    }
  }
}
