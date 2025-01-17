import { Logger } from '../../../../cli';
import {
  CommandError, CommandOption
} from '../../../../Command';
import config from '../../../../config';
import GlobalOptions from '../../../../GlobalOptions';
import request from '../../../../request';
import { spo, ContextInfo, ClientSvcResponse, ClientSvcResponseContents, validation } from '../../../../utils';
import SpoCommand from '../../../base/SpoCommand';
import commands from '../../commands';

interface CommandArgs {
  options: Options;
}

interface Options extends GlobalOptions {
  libraryUrl: string;
  thumbnailUrl?: string;
  cdnType?: string;
}

class SpoOrgAssetsLibraryAddCommand extends SpoCommand {
  public get name(): string {
    return commands.ORGASSETSLIBRARY_ADD;
  }

  public get description(): string {
    return 'Promotes an existing library to become an organization assets library';
  }

  public getTelemetryProperties(args: CommandArgs): any {
    const telemetryProps: any = super.getTelemetryProperties(args);
    telemetryProps.cdnType = args.options.cdnType || 'Private';
    telemetryProps.thumbnailUrl = typeof args.options.thumbnailUrl !== 'undefined';
    return telemetryProps;
  }

  public commandAction(logger: Logger, args: CommandArgs, cb: (err?: any) => void): void {
    let spoAdminUrl: string = '';
    const cdnTypeString: string = args.options.cdnType || 'Private';
    const cdnType: number = cdnTypeString === 'Private' ? 1 : 0;
    const thumbnailSchema: string = typeof args.options.thumbnailUrl === 'undefined' ? `<Parameter Type="Null" />` : `<Parameter Type="String">${args.options.thumbnailUrl}</Parameter>`;

    spo
      .getSpoAdminUrl(logger, this.debug)
      .then((_spoAdminUrl: string): Promise<ContextInfo> => {
        spoAdminUrl = _spoAdminUrl;

        return spo.getRequestDigest(spoAdminUrl);
      })
      .then((res: ContextInfo): Promise<string> => {
        const requestOptions: any = {
          url: `${spoAdminUrl}/_vti_bin/client.svc/ProcessQuery`,
          headers: {
            'X-RequestDigest': res.FormDigestValue
          },
          data: `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="AddToOrgAssetsLibAndCdnWithType" Id="11" ObjectPathId="8"><Parameters><Parameter Type="Enum">${cdnType}</Parameter><Parameter Type="String">${args.options.libraryUrl}</Parameter>${thumbnailSchema}<Parameter Type="Enum">1</Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="8" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /></ObjectPaths></Request>`
        };

        return request.post(requestOptions);
      })
      .then((res: string): void => {
        const json: ClientSvcResponse = JSON.parse(res);
        const response: ClientSvcResponseContents = json[0];
        if (response.ErrorInfo) {
          cb(new CommandError(response.ErrorInfo.ErrorMessage));
          return;
        }
        
        cb();
      }, (err: any): void => this.handleRejectedPromise(err, logger, cb));
  }

  public validate(args: CommandArgs): boolean | string {
    const isValidThumbnailUrl = validation.isValidSharePointUrl((args.options.thumbnailUrl as string));
    if (typeof args.options.thumbnailUrl !== 'undefined' && isValidThumbnailUrl !== true) {
      return isValidThumbnailUrl;
    }

    return validation.isValidSharePointUrl(args.options.libraryUrl);
  }

  public options(): CommandOption[] {
    const options: CommandOption[] = [
      {
        option: '--libraryUrl <libraryUrl>'
      },
      {
        option: '--thumbnailUrl [thumbnailUrl]'
      },
      {
        option: '--cdnType [cdnType]',
        autocomplete: ['Public', 'Private']
      }
    ];

    const parentOptions: CommandOption[] = super.options();
    return options.concat(parentOptions);
  }
}

module.exports = new SpoOrgAssetsLibraryAddCommand();
