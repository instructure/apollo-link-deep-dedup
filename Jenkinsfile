CHANNEL_NAME = '#new_jenkins_noisy'
pipeline {
    agent {
        docker {
            image 'node:8-alpine'
        }
    }
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out commit....'
                checkout scm
                sh 'committer=$(git show -s --pretty=%an) && echo "committer=\"$committer\"" > $WORKSPACE/envvars'
            }
        }

        stage('Build') {
            steps {
                echo 'Building....'
                sh 'npm install && npm run bootstrap && npm run build'
            }
        }

        stage('Test') {
            steps {
                echo 'Running linter...'
                sh 'npm run lint'
                echo 'Testing...'
                sh 'npm run start & npm run test'
            }
        }
    }
    post {
        success {
            sh '. $WORKSPACE/envvars'
            echo '${env.committer}'
            slackSend (
                channel: CHANNEL_NAME,
                color: 'good',
                message: "SUCCESSFUL: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL}) by (${env.GIT_COMMITTER}) :happystar:"
            )
        }

        failure {
            slackSend (
                channel: CHANNEL_NAME,
                color: 'danger',
                message: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL}) :u7981:"
            )
        }
    }
}
