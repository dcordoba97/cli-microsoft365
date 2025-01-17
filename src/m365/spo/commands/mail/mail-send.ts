import { Logger } from '../../../../cli';
import {
  CommandOption
} from '../../../../Command';
import GlobalOptions from '../../../../GlobalOptions';
import request from '../../../../request';
import { validation } from '../../../../utils';
import SpoCommand from '../../../base/SpoCommand';
import commands from '../../commands';

interface CommandArgs {
  options: Options;
}

interface Options extends GlobalOptions {
  webUrl: string;
  to: string;
  subject: string;
  body: string;
  from?: string;
  cc?: string;
  bcc?: string;
  additionalHeaders?: string;
}

class SpoMailSendCommand extends SpoCommand {
  public get name(): string {
    return commands.MAIL_SEND;
  }

  public get description(): string {
    return 'Sends an e-mail from SharePoint';
  }

  public getTelemetryProperties(args: CommandArgs): any {
    const telemetryProps: any = super.getTelemetryProperties(args);
    telemetryProps.from = typeof args.options.from !== 'undefined';
    telemetryProps.cc = typeof args.options.cc !== 'undefined';
    telemetryProps.bcc = typeof args.options.bcc !== 'undefined';
    telemetryProps.additionalHeaders = typeof args.options.additionalHeaders !== 'undefined';
    return telemetryProps;
  }

  public commandAction(logger: Logger, args: CommandArgs, cb: () => void): void {
    const params: any = {
      properties: {
        __metadata: { "type": "SP.Utilities.EmailProperties" },
        Body: args.options.body,
        Subject: args.options.subject,
        To: { results: args.options.to.replace(/\s+/g, '').split(',') }
      }
    };

    if (args.options.from && args.options.from.length > 0) {
      params.properties.From = args.options.from;
    }

    if (args.options.cc && args.options.cc.length > 0) {
      params.properties.CC = { results: args.options.cc.replace(/\s+/g, '').split(',') };
    }

    if (args.options.bcc && args.options.bcc.length > 0) {
      params.properties.BCC = { results: args.options.bcc.replace(/\s+/g, '').split(',') };
    }

    if (args.options.additionalHeaders) {
      const h = JSON.parse(args.options.additionalHeaders);
      params.properties.AdditionalHeaders = {
        __metadata: { "type": "Collection(SP.KeyValue)" },
        results: Object.keys(h).map(key => {
          return {
            __metadata: {
              type: 'SP.KeyValue'
            },
            Key: key,
            Value: h[key],
            ValueType: 'Edm.String'
          };
        })
      };
    }

    const requestOptions: any = {
      url: `${args.options.webUrl}/_api/SP.Utilities.Utility.SendEmail`,
      headers: {
        'content-type': 'application/json;odata=verbose'
      },
      responseType: 'json',
      data: params
    };

    request
      .post(requestOptions)
      .then(_ => cb(), (rawRes: any): void => this.handleRejectedODataJsonPromise(rawRes, logger, cb));
  }

  public options(): CommandOption[] {
    const options: CommandOption[] = [
      {
        option: '-u, --webUrl <webUrl>'
      },
      {
        option: '--to <to>'
      },
      {
        option: '--subject <subject>'
      },
      {
        option: '--body <body>'
      },
      {
        option: '--from [from]'
      },
      {
        option: '--cc [cc]'
      },
      {
        option: '--bcc [bcc]'
      },
      {
        option: '--additionalHeaders [additionalHeaders]'
      }
    ];

    const parentOptions: CommandOption[] = super.options();
    return options.concat(parentOptions);
  }

  public validate(args: CommandArgs): boolean | string {
    return validation.isValidSharePointUrl(args.options.webUrl);
  }
}

module.exports = new SpoMailSendCommand();
