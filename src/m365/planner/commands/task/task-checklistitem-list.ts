import { Logger } from "../../../../cli";
import { CommandOption } from "../../../../Command";
import { accessToken } from "../../../../utils";
import GlobalOptions from "../../../../GlobalOptions";
import Auth from "../../../../Auth";
import request from "../../../../request";
import GraphCommand from "../../../base/GraphCommand";
import commands from "../../commands";

interface CommandArgs {
  options: Options;
}

interface Options extends GlobalOptions {
  taskId: string;
}

class PlannerTaskChecklistItemListCommand extends GraphCommand {
  public get name(): string {
    return commands.TASK_CHECKLISTITEM_LIST;
  }

  public get description(): string {
    return "Lists the checklist items of a Planner task.";
  }
  public defaultProperties(): string[] | undefined {
    return ['id', 'title', 'isChecked'];
  }

  public commandAction(logger: Logger, args: CommandArgs, cb: () => void): void {
    if (accessToken.isAppOnlyAccessToken(Auth.service.accessTokens[this.resource].accessToken)) {
      this.handleError('This command does not support application permissions.', logger, cb);
      return;
    }

    const requestOptions: any = {
      url: `${this.resource}/v1.0/planner/tasks/${encodeURIComponent(args.options.taskId)}/details?$select=checklist`,
      headers: {
        accept: "application/json;odata.metadata=none"
      },
      responseType: "json"
    };

    request.get(requestOptions).then(
      (res: any): void => {
        if (!args.options.output || args.options.output === 'json') {
          logger.log(res.checklist);
        }
        else {
          //converted to text friendly output
          const output = Object.getOwnPropertyNames(res.checklist).map(prop => ({ id: prop, ...(res.checklist as any)[prop] }));
          logger.log(output);
        }
        cb();
      },
      (err: any): void => this.handleRejectedODataJsonPromise(err, logger, cb)
    );
  }
  public options(): CommandOption[] {
    const options: CommandOption[] = [
      {
        option: "-i, --taskId <taskId>"
      }
    ];

    const parentOptions: CommandOption[] = super.options();
    return options.concat(parentOptions);
  }
}

module.exports = new PlannerTaskChecklistItemListCommand();