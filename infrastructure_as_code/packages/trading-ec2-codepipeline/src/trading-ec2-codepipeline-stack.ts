import { App, Stack, StackProps } from "@aws-cdk/cdk";
import { Repository } from "@aws-cdk/aws-codecommit";
import { ManualApprovalAction, Pipeline } from "@aws-cdk/aws-codepipeline";
import { PipelineProject,  BuildEnvironmentVariableType, LinuxBuildImage } from "@aws-cdk/aws-codebuild";
import { PipelineCreateUpdateStackAction, PipelineDeleteStackAction } from "@aws-cdk/aws-cloudformation";
import {
  ServerApplication,
  ServerDeploymentGroup,
  InstanceTagSet
} from "@aws-cdk/aws-codedeploy";
import { PolicyStatement } from '@aws-cdk/aws-iam';

const TEMPLATE_PREFIX = "Templates";
const BUILD_SPEC_PREFIX = "BuildSpecs";

const STACK_NAME = 'TEST-Stack';

export class TradingEc2CodepipelineStack extends Stack {
  constructor(parent: App, name: string, props?: StackProps) {
    super(parent, name, props);

    const pipeline = new Pipeline(this, "Pipeline", {
      pipelineName: "trading-pipeline"
    });

    const sourceStage = pipeline.addStage("Source");
    const repo = new Repository(this, "Repository", {
      repositoryName: "trading_ec2_pipeline_demo",
      description: "Some description."
    });
    repo.addToPipeline(sourceStage, "CodeCommit");

    const buildStage = pipeline.addStage("Build");
    const unitTest = new PipelineProject(this, "UnittestProject", {
       environment: {
        buildImage: LinuxBuildImage.UBUNTU_14_04_PYTHON_3_6_5
        
      },
      buildSpec: `${BUILD_SPEC_PREFIX}/unittest-buildspec.yml`
    });
    unitTest.addToPipelineAsTest(buildStage, "Build");

    const provisionStage = pipeline.addStage("Provision");
    const prepare = new PipelineProject(this, "PrepareProject", {
      buildSpec: `${BUILD_SPEC_PREFIX}/prepare-buildspec.yml`,
      environment: {
        buildImage: LinuxBuildImage.UBUNTU_14_04_PYTHON_3_6_5
        
      },
      environmentVariables: {
        'ENV_PREFIX': {
          type: BuildEnvironmentVariableType.PlainText,
          value: 'TEST-',
        },
      }
    });
    prepare.addToRolePolicy(new  PolicyStatement().addAllResources().addAction('ssm:GetParameter')); // TODO
    const prepareAction = prepare.addToPipeline(provisionStage, "Prepare", {
      outputArtifactName: "AppPre",
      runOrder: 1
    });

    new PipelineCreateUpdateStackAction(this, "CreateUpdateStackAction", {
      templatePath: prepareAction.outputArtifact.atPath(
        `${TEMPLATE_PREFIX}/demo-provision.yaml`
      ),
      templateConfiguration: prepareAction.outputArtifact.atPath(
        `${TEMPLATE_PREFIX}/demo-provision-configuration.json`
      ),
      stage: provisionStage,
      stackName: STACK_NAME,
      adminPermissions: true,
      runOrder: 2
    });

    const deployStage = pipeline.addStage("Deploy");
    const application = new ServerApplication(this, "Application", {
      applicationName: "TESTApplication"
    });
    const deploymentGroup = new ServerDeploymentGroup(this, "DeploymentGroup", {
      application,
      deploymentGroupName: "TESTDeploymentGroup",
      ec2InstanceTags: new InstanceTagSet({
        CodeDeployInstance: ["TESTWebServer"] //!!!!
      })
    });
    deploymentGroup.addToPipeline(deployStage, "TestDeploy", {
      inputArtifact: prepareAction.outputArtifact
    });
    
    const cleanStage = pipeline.addStage("Clean");
    new ManualApprovalAction(this, 'ApprovalAction', {
      notifyEmails: ['frank.huebner@ewe.de'],
      stage: cleanStage,
      runOrder: 1,
      additionalInformation: 'Remove'
    });

    new PipelineDeleteStackAction(this, "DeleteAction", {
      adminPermissions: true,
      stackName: STACK_NAME,
      stage: cleanStage,
      runOrder: 2,
    });
  }
}
